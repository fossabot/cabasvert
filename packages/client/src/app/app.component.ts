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

import { Component, Inject, LOCALE_ID, OnInit, QueryList, ViewChildren } from '@angular/core';
import { ActivatedRoute, Router, Scroll } from '@angular/router';
import { Plugins, StatusBarStyle } from '@capacitor/core';
import {
  ActionSheetController,
  IonRouterOutlet,
  MenuController,
  ModalController,
  NavController,
  Platform,
  PopoverController,
} from '@ionic/angular';
import { BackButtonEvent } from '@ionic/core';
import { TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { filter, take } from 'rxjs/operators';
import { APP_VERSION } from '../version';

import { PageGroup, PAGES } from './menu-page.interface';
import { AuthService, User } from './toolkit/providers/auth-service';

const { SplashScreen, StatusBar, App } = Plugins;

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
})
export class AppComponent implements OnInit {

  pageGroups: PageGroup[] = PAGES;

  appVersionNumber: string;

  user$: Observable<User>;

  @ViewChildren(IonRouterOutlet) routerOutlets: QueryList<IonRouterOutlet>;

  constructor(private platform: Platform,
              private translate: TranslateService,
              private authService: AuthService,
              private navCtrl: NavController,
              private popoverCtrl: PopoverController,
              private actionSheetCtrl: ActionSheetController,
              private modalCtrl: ModalController,
              private menuCtrl: MenuController,
              private router: Router,
              private route: ActivatedRoute,
              @Inject(LOCALE_ID) private locale: string) {

    this.initializeApp();
  }

  private async initializeApp() {
    await this.platform.ready();

    this.initTranslation();

    if (this.platform.is('android') || this.platform.is('ios')) {
      await StatusBar.setStyle({ style: StatusBarStyle.Light });
      await StatusBar.setBackgroundColor({ color: '#126019' });
    }

    try {
      this.appVersionNumber = APP_VERSION;
    } catch (error) {
    }

    // Wait for the initial navigation to succeed before hiding the splash screen
    this.router.events.pipe(
      filter(e => e instanceof Scroll),
      take(1),
    ).subscribe(() => {
      if (this.platform.is('android') || this.platform.is('ios')) {
        SplashScreen.hide();
      }
    });

    if (this.platform.is('android') || this.platform.is('ios')) {
      window.document.addEventListener('ionBackButton', (ev) => {
        // Override Ionic's default behavior
        (ev as BackButtonEvent).detail.register(50, async () => await this.goBack());
      });
    }
  }

  initTranslation() {
    let userLang = this.locale.split('-')[0];

    this.translate.setDefaultLang('fr');
    this.translate.use(userLang);

    this.translate.get('language', null).subscribe(localizedValue =>
      console.log(`Selected language: ${localizedValue}`),
    );
  }

  ngOnInit() {
    this.user$ = this.authService.loggedInUser$;
  }

  async navigateToPage(page) {
    let commands = ['/' + page.path];
    if (page.params) commands.push(page.params);

    this.menuCtrl.close();

    await this.navCtrl.navigateRoot(commands);
  }

  async logout() {
    await this.authService.logout();

    this.menuCtrl.close();

    await this.navCtrl.navigateRoot(['/login']);
  }

  async goBack() {
    let canGoBack = this.routerOutlets.find(outlet => outlet && outlet.canGoBack());
    if (canGoBack) {
      this.navCtrl.goBack();
    } else {
      await this.navCtrl.navigateRoot('/dashboard');
    }
  }
}
