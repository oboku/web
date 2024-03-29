import { waitFor } from "../../common/utils"
import React, {
  FC,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState
} from "react"
import { Report } from "../../debug/report.shared"

type ContextValue = [
  typeof gapi | undefined,
  "loading" | "signedOut" | "signedIn",
  () => Promise<typeof gapi | undefined>
]

const defaultContextValue: ContextValue = [
  undefined,
  "loading",
  async () => undefined
]

const GoogleAPIContext = React.createContext(defaultContextValue)

// const SCOPE = `https://www.googleapis.com/auth/drive.metadata.readonly https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.readonly`
// const SCOPE = `https://www.googleapis.com/auth/drive.file`

// We need this scope because we need to read / download / delete files outside of oboku scope.
// This is one of the most sensitive scope.
const SCOPE = `https://www.googleapis.com/auth/drive`

/**
 *
 * @see https://developers.google.com/drive/api/v3/search-files
 */
export const listFiles = (googleAuth, searchTerm) => {}

export const GoogleApiProvider: FC<{children: ReactNode}> = ({ children }) => {
  const [googleApi, setGoogleApi] = useState<typeof gapi | undefined>(undefined)
  const isSigning = useRef(false)
  const [contextValue, setContextValue] = useState(defaultContextValue)
  const [isSigned, setIsSigned] = useState(false)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    const script = document.createElement("script")
    script.src = "https://apis.google.com/js/api.js"
    script.onload = () => {
      setGoogleApi(window.gapi)
    }
    document.body.appendChild(script)
  }, [])

  useEffect(() => {
    if (googleApi) {
      window.gapi.load("picker", () => {})
      window.gapi.load("client:auth2", async () => {
        try {
          await window.gapi.client.init({
            clientId:
              "325550353363-vklpik5kklrfohg1vdrkvjp1n8dopnrd.apps.googleusercontent.com",
            // plugin_name: "login", // allow old api to work until migration
            scope: SCOPE,
            discoveryDocs: [
              "https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"
            ]
          })

          const onSignIn = (signedIn: boolean) => {
            setIsSigned(signedIn)
          }

          googleApi.auth2.getAuthInstance().isSignedIn.listen(onSignIn)

          // handle initial state
          onSignIn(googleApi.auth2.getAuthInstance().isSignedIn.get())

          // @ts-ignore
          window.googleApi = googleApi
          setIsReady(true)
        } catch (e) {
          Report.error(e)
        }
      })
    }
  }, [googleApi])

  /**
   * Will signin and return the gapi if success, otherwise undefined
   */
  const signIn = useCallback(async (): Promise<typeof gapi | undefined> => {
    if (isSigning.current) {
      await waitFor(10)
      return await signIn()
    }
    isSigning.current = true
    try {
      // await googleApi?.auth2.getAuthInstance().signIn({ prompt: 'consent' })
      await googleApi?.auth2.getAuthInstance().signIn()

      return googleApi
    } catch (e) {
      throw e
    } finally {
      isSigning.current = false
    }
  }, [googleApi])

  useEffect(() => {
    setContextValue([
      isSigned ? googleApi : undefined,
      isReady ? (isSigned ? "signedIn" : "signedOut") : "loading",
      signIn
    ])
  }, [signIn, isSigned, isReady, setContextValue, googleApi])

  return (
    <GoogleAPIContext.Provider value={contextValue}>
      {children}
    </GoogleAPIContext.Provider>
  )
}

export const useGetLazySignedGapi = () => {
  const [signedGoogleApi, , signIn] = useContext(GoogleAPIContext)
  const [error, setError] = useState<undefined | Error>(undefined)

  const getter = useCallback(async () => {
    setError(undefined)
    try {
      const gapi = signedGoogleApi || (await signIn())
      if (gapi && gapi.auth2.getAuthInstance().isSignedIn.get()) {
        if (
          !gapi.auth2
            .getAuthInstance()
            .currentUser.get()
            .hasGrantedScopes(SCOPE)
        ) {
          await gapi.auth2
            .getAuthInstance()
            .currentUser.get()
            .grant({ scope: SCOPE })
        }

        return {
          gapi: gapi,
          credentials: gapi.auth2
            .getAuthInstance()
            .currentUser.get()
            .getAuthResponse()
        }
      }
    } catch (e) {
      console.error(e)
      setError(new Error((e as any)?.error))
    }
  }, [signedGoogleApi, signIn, setError])

  return [getter, signedGoogleApi, { error }] as [
    typeof getter,
    typeof signedGoogleApi,
    { error: typeof error }
  ]
}

export const useGetCredentials = () => {
  const [getLazySignedGapi] = useGetLazySignedGapi()

  return useCallback(async () => {
    try {
      const auth = (await getLazySignedGapi())?.credentials

      if (!auth) throw new Error("unknown")

      return { data: auth as unknown as { [key: string]: string } }
    } catch (e) {
      if ((e as any)?.error === "popup_closed_by_user") {
        return { isError: true, reason: "cancelled" } as {
          isError: true
          reason: "cancelled"
        }
      }
      if ((e as any)?.error === "popup_blocked_by_browser") {
        return { isError: true, reason: "popupBlocked" } as {
          isError: true
          reason: "popupBlocked"
        }
      }
      throw e
    }
  }, [getLazySignedGapi])
}

export const extractIdFromResourceId = (resourceId: string) =>
  resourceId.replace(`drive-`, ``)
