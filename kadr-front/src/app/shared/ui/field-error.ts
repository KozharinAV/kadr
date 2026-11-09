import { AbstractControl } from '@angular/forms';

export function fieldErrorKey(control: AbstractControl): string | null {
  if (!control.touched || !control.errors) {
    return null;
  }
  if (control.hasError('required')) {
    return 'validation.required';
  }
  if (control.hasError('email')) {
    return 'validation.email';
  }
  if (control.hasError('minlength')) {
    return 'validation.minLength';
  }
  return 'validation.invalid';
}
