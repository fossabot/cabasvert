/*
 * This file is part of CabasVert.
 *
 * Copyright 2017, 2018 Didier Villevalois
 *
 * CabasVert is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * CabasVert is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with CabasVert.  If not, see <http://www.gnu.org/licenses/>.
 */

import * as PouchHttp from 'pouchdb-adapter-http'
import * as PouchAuth from 'pouchdb-authentication'
import * as PouchDB from 'pouchdb-core'
import * as PouchFind from 'pouchdb-find'
import * as PouchSecurity from 'pouchdb-security-helper'

import 'reflect-metadata'
import * as winston from 'winston'
import { testConfiguration } from '../config-test'

import { DatabaseService } from './database.service'

PouchDB
  .plugin(PouchHttp)
  .plugin(PouchFind)
  .plugin(PouchAuth)
  .plugin(PouchSecurity)

describe('DatabaseService', () => {

  let configuration = testConfiguration()

  let serverUser = configuration.database.auth

  let nullLogger: winston.Logger
  let databaseService: DatabaseService
  let database

  beforeAll(async () => {
    // Ensure database exists
    database = new PouchDB(configuration.database.url + '/_users')
    await database.info()
  })

  beforeEach(async () => {

    nullLogger = winston.createLogger({
      transports: [new winston.transports.Console({ silent: true })],
    })
    databaseService = new DatabaseService(configuration, nullLogger)

    // Create user database
    database = new PouchDB(configuration.database.url + '/_users', { skip_setup: true })

    await database.signUpAdmin('admin', 'password')
    await database.logIn('admin', 'password')

    // Add server admin user
    await database.signUp(serverUser.username, serverUser.password, {
      roles: ['cabasvert:admin'],
    })

    try {
      let security = database.security()
      await security.fetch()
      security.admins.roles.add('cabasvert:admin')
      await security.save()
    } catch (e) {
    }

    // Add a fake user to database
    await database.signUp('john.doe@example.com', 'password', {
      metadata: {
        metadata: {
          name: 'John Doe',
          email: 'john.doe@example.com',
        },
      },
    })

    await database.logOut()
  })

  afterEach(async () => {
    await database.logIn('admin', 'password')

    try {
      let security = database.security()
      await security.fetch()
      security.reset()
      await security.save()
    } catch (e) {
    }

    await database.deleteUser(serverUser.username)

    await database.deleteUser('john.doe@example.com')

    await database.deleteAdmin('admin')
    await database.logOut()
  })

  it('initializes properly', async () => {
    await databaseService.initialize()
  })

  it('can\'t initialize properly if server user does not exist', async () => {
    await database.logIn('admin', 'password')
    await database.deleteUser(serverUser.username)
    await database.logOut()

    try {

      await databaseService.initialize()

      expect(false).toBe(true)
    } catch (error) {
      expect(error).toBeDefined()
    } finally {

      await database.logIn('admin', 'password')
      await database.signUp(serverUser.username, serverUser.password, {
        roles: ['cabasvert:admin'],
      })
      await database.logOut()
    }
  })

  it('can retrieve users by their id', async () => {
    try {
      await databaseService.logIn()

      let user = await databaseService.getUser('john.doe@example.com')

      expect(user).toMatchObject({
        _id: 'org.couchdb.user:john.doe@example.com',
        type: 'user',
        name: 'john.doe@example.com',
        roles: [],
        metadata: { name: 'John Doe', email: 'john.doe@example.com' },
      })
    } finally {
      await databaseService.logOut()
    }
  })

  it('errors if user is not found', async () => {
    try {
      await databaseService.logIn()

      await databaseService.getUser('jane.smith@me.com')

    } catch (error) {
      expect(error).toBeDefined()
    } finally {
      await databaseService.logOut()
    }
  })

  it('can update users\' metadata', async () => {
    try {
      await databaseService.logIn()

      expect(
        await databaseService.updateUser('john.doe@example.com', {
          metadata: {
            name: 'metadata',
            email: 'john.doe@example.com',
          },
        }),
      ).toEqual(true)

      let user = await databaseService.getUser('john.doe@example.com')

      expect(user).toEqual(jasmine.objectContaining({
        metadata: jasmine.objectContaining({
          name: 'metadata',
        }),
      }))
    } finally {
      await databaseService.logOut()
    }
  })

  it('can change users\' passwords', async () => {
    try {
      await databaseService.logIn()

      expect(
        await databaseService.changePassword('john.doe@example.com', 'newPassword'),
      ).toEqual(true)
    } finally {
      await databaseService.logOut()
    }

    expect(
      await database.logIn('john.doe@example.com', 'newPassword'),
    ).toEqual({ ok: true, name: 'john.doe@example.com', roles: [] })

    await database.logOut()
  })

  it('reports OK status', async () => {
    expect(await databaseService.status()).toEqual({ ok: true })
  })

  it('reports KO status if server user does not exist', async () => {
    let failConfiguration = testConfiguration()
    failConfiguration.database.auth = { username: 'fakeadmin', password: 'fakepassword' }
    databaseService = new DatabaseService(failConfiguration, nullLogger)

    expect(await databaseService.status()).toEqual({
      ok: false,
      error: {
        error: 'unauthorized',
        reason: 'Name or password is incorrect.',
        name: 'unauthorized',
        status: 401,
        message: 'Name or password is incorrect.',
      },
    })
  })

  it('reports KO status if database is offline', async () => {
    let failConfiguration = testConfiguration()
    failConfiguration.database.url = 'http://erroneous'
    databaseService = new DatabaseService(failConfiguration, nullLogger)

    expect(await databaseService.status()).toEqual({
      ok: false,
      error: {
        errno: 'ENOTFOUND',
        code: 'ENOTFOUND',
        syscall: 'getaddrinfo',
        hostname: 'erroneous',
        host: 'erroneous',
        port: 80,
        status: 500,
      },
    })
  })
})
