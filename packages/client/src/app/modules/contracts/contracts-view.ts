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

import { Component, Input, OnInit } from '@angular/core'
import { Observable } from 'rxjs'
import { SeasonService } from '../seasons/season.service'
import { Contract, ContractFormulas, ContractKind } from './contract.model'
import { ContractService } from './contract.service'

@Component({
  selector: 'contracts-view',
  templateUrl: './contracts-view.html',
  styleUrls: ['./contracts-view.scss'],
})
export class ContractsView implements OnInit {
  @Input() contract: Contract
  seasonName: Observable<string>

  messages: string[]
  severity: string

  Kinds = ContractKind
  Formulas = ContractFormulas

  JSON = JSON

  constructor(public seasonService: SeasonService) {
  }

  ngOnInit() {
    let problems = ContractService.validateContract(this.contract)
    this.messages = ContractService.contractValidationMessages(problems)
    this.severity = ContractService.contractValidationSeverity(problems)

    this.seasonName = this.seasonService.seasonNameById$(this.contract.season)
  }
}
