import React, { useEffect } from 'react'
import {
  BrowserRouter,
  Switch,
  Route,
  Redirect,
  useHistory,
} from "react-router-dom"
import { HomeScreen } from '../HomeScreen'
import { LoginScreen } from '../auth/LoginScreen'
import { ReaderScreen } from '../reader/ReaderScreen'
import { BottomTabBar } from '../BottomTabBar'
import { ProfileScreen } from '../settings/ProfileScreen'
import { ManageStorageScreen } from '../settings/ManageStorageScreen'
import { LibraryTopTabNavigator } from '../library/LibraryTopTabNavigator'
import { ROUTES } from '../constants'
import { BookDetailsScreen } from '../books/BookDetailsScreen'
import { CollectionDetailsScreen } from '../collections/CollectionDetailsScreen'
import { RegisterScreen } from '../auth/RegisterScreen'
import { BookActionsDrawer } from '../books/BookActionsDrawer'
import { DataSourcesScreen } from '../dataSources/DataSourcesScreen'
import { SearchScreen } from '../search/SearchScreen'
import { AuthCallbackScreen } from '../auth/AuthCallbackScreen'
import { SettingsScreen } from '../settings/SettingsScreen'
import { Box } from '@material-ui/core'
import { useRecoilValue } from 'recoil'
import { authState } from '../auth/authState'

export const AppNavigator = () => {
  const auth = useRecoilValue(authState)
  const isAuthenticated = !!auth?.token

  return (
    <BrowserRouter basename={process.env.PUBLIC_URL} >
      <Box display="flex" flexDirection="column" flex={1} height="100%" flexShrink={0}>
        <Switch>
          <Route path={ROUTES.AUTH_CALLBACK}>
            <AuthCallbackScreen />
          </Route>
          {isAuthenticated
            ? (
              <Switch>
                <Route path="/reader/:bookId" >
                  <ReaderScreen />
                </Route>
                <Route exact path={ROUTES.BOOK_DETAILS} >
                  <BookDetailsScreen />
                </Route>
                <Route exact path={ROUTES.COLLECTION_DETAILS} >
                  <CollectionDetailsScreen />
                </Route>
                <Route exact path={ROUTES.SEARCH}>
                  <SearchScreen />
                </Route>
                <Route path={`${ROUTES.PROFILE}/manage-storage`} >
                  <ManageStorageScreen />
                </Route>
                <Route path={`${ROUTES.SETTINGS}`} >
                  <SettingsScreen />
                </Route>
                <BottomTabBar>
                  <Switch>
                    <Route exact path={ROUTES.PROFILE}>
                      <ProfileScreen />
                    </Route>
                    <Route path="/library">
                      <LibraryTopTabNavigator />
                    </Route>
                    <Route exact path="/">
                      <HomeScreen />
                    </Route>
                    <Route exact path={ROUTES.DATASOURCES}>
                      <DataSourcesScreen />
                    </Route>
                    <Route path="/">
                      <Redirect to="/" />
                    </Route>
                  </Switch>
                </BottomTabBar>
              </Switch>
            )
            : (
              <Switch>
                <Route exact path={ROUTES.LOGIN}>
                  <LoginScreen />
                </Route>
                <Route exact path={ROUTES.REGISTER}>
                  <RegisterScreen />
                </Route>
                <Redirect
                  to={{
                    pathname: ROUTES.LOGIN,
                  }}
                />
              </Switch>
            )}
        </Switch>
      </Box>
      <BookActionsDrawer />
      <BackBehaviorWatcher />
    </BrowserRouter>
  )
}

const BackBehaviorWatcher = () => {
  const history = useHistory()

  // console.log(history)
  useEffect(() => {
    window.onpopstate = function (event) {
      // alert(`location: ${document.location}, state: ${JSON.stringify(event.state)}`)
    }

    history.listen((location, action) => {
      // debugger
      // console.log(location, action)

      // history.push(ROUTES.HOME)
    })
  }, [history])

  return null
}