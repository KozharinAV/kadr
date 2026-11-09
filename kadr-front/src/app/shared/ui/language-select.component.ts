import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatMenuModule } from '@angular/material/menu';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { startWith } from 'rxjs';

const LANGUAGES = ['ru', 'en'] as const;

type AppLang = (typeof LANGUAGES)[number];

@Component({
  selector: 'app-language-select',
  imports: [MatMenuModule, TranslocoPipe],
  templateUrl: './language-select.component.html',
  styleUrl: './language-select.component.scss',
})
export class LanguageSelect {
  private readonly transloco = inject(TranslocoService);

  readonly options: { id: AppLang; code: string; label: string }[] = [
    { id: 'ru', code: 'RU', label: 'Русский' },
    { id: 'en', code: 'EN', label: 'English' },
  ];
  readonly lang = toSignal(this.transloco.langChanges$.pipe(startWith(this.transloco.getActiveLang())), {
    initialValue: this.transloco.getActiveLang(),
  });
  readonly current = computed(
    () => this.options.find((option) => option.id === this.lang()) ?? this.options[0],
  );

  setLang(value: unknown): void {
    if (!isAppLang(value) || value === this.transloco.getActiveLang()) {
      return;
    }
    this.transloco.setActiveLang(value);
    localStorage.setItem('kadr.lang', value);
  }
}

function isAppLang(value: unknown): value is AppLang {
  return LANGUAGES.some((lang) => lang === value);
}
