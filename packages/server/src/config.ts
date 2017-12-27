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

import { readFileSync } from 'graceful-fs'

export type Configuration = {
  port: number

  clientApplication: {
    url: string
  }

  database: {
    url: string
    auth: {
      username: string
      password: string
    }
  }

  email: string

  smtpConnection: {
    host: string
    port: number
    secure: boolean
    auth: {
      username: string
      password: string
    }
  }
}

export function defaultConfiguration() {
  return parseJsonFile<Configuration>('config.json')
}

export function parseJsonFile<T>(path: string): T {
  let data = readFileSync(path, 'utf8')
  return JSON.parse(data)
}
