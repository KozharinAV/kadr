import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-video-link',
  template: '',
})
export class VideoLink {
  constructor() {
    const id = inject(ActivatedRoute).snapshot.paramMap.get('id');
    void inject(Router).navigate(['/library'], {
      queryParams: { watch: id },
      replaceUrl: true,
    });
  }
}
