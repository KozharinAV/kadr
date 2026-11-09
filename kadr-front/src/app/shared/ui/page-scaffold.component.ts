import { Component, input } from '@angular/core';

@Component({
  selector: 'app-page-scaffold',
  template: `
    @if (title() || heading()) {
      <header class="header">
        @if (title()) {
          <h1>{{ title() }}</h1>
        }
        <ng-content select="[pageHeading]" />
        <div class="actions">
          <ng-content select="[pageActions]" />
        </div>
      </header>
    }
    <ng-content />
  `,
  styleUrl: './page-scaffold.component.scss',
})
export class PageScaffold {
  readonly title = input('');
  readonly heading = input(false);
}
