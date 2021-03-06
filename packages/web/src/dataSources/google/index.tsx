import { ObokuPlugin } from "@oboku/plugin-front"
import { UNIQUE_RESOURCE_IDENTIFIER } from "./constants"
import { ReactComponent as GoogleDriveAsset } from "../../assets/google-drive.svg"
import { SvgIcon } from "@mui/material"
import { UploadBook } from "./UploadBook"

import { useDownloadBook } from "./useDownloadBook"
import { useRemoveBook } from "./useRemoveBook"
import { GoogleDriveDataSource as AddDataSource } from "./GoogleDriveDataSource"
import { SelectItem as SelectItemComponent } from "./SelectItem"
import { useGetCredentials } from "./helpers"
import { useSyncSourceInfo } from "./useSyncSourceInfo"

const GoogleDriveIcon = () => (
  <SvgIcon>
    <GoogleDriveAsset />
  </SvgIcon>
)

export const plugin: ObokuPlugin = {
  uniqueResourceIdentifier: UNIQUE_RESOURCE_IDENTIFIER,
  type: `DRIVE`,
  name: "Google Drive",
  Icon: GoogleDriveIcon,
  UploadComponent: UploadBook,
  synchronizable: true,
  useDownloadBook,
  useRemoveBook,
  AddDataSource,
  useGetCredentials,
  SelectItemComponent,
  useSyncSourceInfo
}
