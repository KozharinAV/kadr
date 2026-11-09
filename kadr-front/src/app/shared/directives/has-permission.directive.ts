import { Directive, TemplateRef, ViewContainerRef, effect, inject, input } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from '../../core/auth/auth.service';

@Directive({
  selector: '[appHasPermission]',
})
export class HasPermission {
  private readonly templateRef = inject(TemplateRef<unknown>);
  private readonly viewContainer = inject(ViewContainerRef);
  private readonly auth = inject(AuthService);
  readonly appHasPermission = input.required<string>();
  private readonly user = toSignal(this.auth.user$, { initialValue: null });
  private rendered = false;

  constructor() {
    effect(() => {
      const user = this.user();
      const allowed = !!user && user.permissions.includes(this.appHasPermission());
      if (allowed && !this.rendered) {
        this.viewContainer.createEmbeddedView(this.templateRef);
        this.rendered = true;
      } else if (!allowed && this.rendered) {
        this.viewContainer.clear();
        this.rendered = false;
      }
    });
  }
}
