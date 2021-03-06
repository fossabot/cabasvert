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

import { Component, OnDestroy, OnInit } from '@angular/core'
import { SeasonWeek } from '@cabasvert/data'
import { NavController } from '@ionic/angular'
import { Observable, Subscription } from 'rxjs'

import { AuthService, Roles, User } from '../../toolkit/providers/auth-service'
import { errors, ignoreErrors } from '../../utils/observables'

import { ContractKind } from '../contracts/contract.model'
import { BasketSectionTotals } from '../distributions/distribution.model'
import { DistributionService } from '../distributions/distribution.service'
import { SeasonService } from '../seasons/season.service'

@Component({
  selector: 'page-welcome',
  templateUrl: 'welcome-page.html',
  styleUrls: ['welcome-page.scss'],
})
export class WelcomePage implements OnInit, OnDestroy {

  Kinds = ContractKind

  week$: Observable<SeasonWeek>
  totals$: Observable<{ [kind: string]: BasketSectionTotals }>

  error$: Observable<string>

  user: User
  private subscription: Subscription

  constructor(private navCtrl: NavController,
              public seasons: SeasonService,
              public distributions: DistributionService,
              public authService: AuthService) {
  }

  ngOnInit() {
    let seasonWeek$ = this.seasons.todaysSeasonWeek$
    this.week$ = seasonWeek$.pipe(ignoreErrors())
    this.error$ = seasonWeek$.pipe(errors())

    this.totals$ = this.distributions.todaysTotals$

    this.subscription = this.authService.loggedInUser$.subscribe(user => this.user = user)
  }

  ngOnDestroy() {
    this.subscription.unsubscribe()
  }

  isDistributor(): boolean {
    return this.user && this.user.hasRole(Roles.DISTRIBUTOR)
  }

  async openDistributionPage() {
    await this.navCtrl.navigateRoot(['./distribution'])
  }
}
