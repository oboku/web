import React from 'react'
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Redirect,
} from "react-router-dom"
import { HomeScreen } from './HomeScreen'
import { LoginScreen } from './auth/LoginScreen'
import { ReaderScreen } from './reader/ReaderScreen'
import { BottomTabBar } from './BottomTabBar'
import { SettingsScreen } from './settings/SettingsScreen'
import { ManageStorageScreen } from './settings/ManageStorageScreen'
import { LibraryTopTabNavigator } from './library/LibraryTopTabNavigator'
import { ROUTES } from './constants'
import { BookDetailsScreen } from './books/BookDetailsScreen'
import { CollectionDetailsScreen } from './collections/CollectionDetailsScreen'
import { RegisterScreen } from './auth/RegisterScreen'
import { BookActionsDrawer } from './books/BookActionsDrawer'
import { DataSourcesScreen } from './dataSources/DataSourcesScreen'
import { FAQScreen } from './FAQScreen'
import { useAuth } from './auth/helpers'
import { SearchScreen } from './search/SearchScreen'

export const AppNavigator = () => {
  const auth = useAuth()
  const isAuthenticated = !!auth?.token

  console.log('AUTH', auth)

  if (auth === undefined) return null

  return (
    <Router basename={process.env.PUBLIC_URL}>
      <div style={{
        height: '100%',
        display: 'flex',
        flexFlow: 'column'
      }}>
        {isAuthenticated
          ? (
            <Switch>
              <Route path="/reader/:bookId" >
                <ReaderScreen />
              </Route>
              <Route path="/settings/manage-storage" >
                <ManageStorageScreen />
              </Route>
              <Route exact path={ROUTES.BOOK_DETAILS} >
                <BookDetailsScreen />
              </Route>
              <Route exact path={ROUTES.COLLECTION_DETAILS} >
                <CollectionDetailsScreen />
              </Route>
              <Route exact path={ROUTES.FAQ}>
                <FAQScreen />
              </Route>
              <Route exact path={ROUTES.SEARCH}>
                <SearchScreen />
              </Route>
              <BottomTabBar>
                <Switch>
                  <Route exact path="/settings">
                    <SettingsScreen />
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
      </div>
      <BookActionsDrawer />
    </Router>
  )
}
