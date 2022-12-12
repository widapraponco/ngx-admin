import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { RestService } from '../services/rest.service';
import { GetPage } from './base.model';

export class IBaseService {
  create: any;
  update: any;
  get: any;
  getById: any;
  delete: any;
}

@Injectable()
export class BaseService<T, M, N> implements IBaseService {

  baseUrl = ''
  constructor(public restService: RestService) {}

  create(payload: N): Observable<M> {
    return this.restService.request<N, M>({
        method: 'POST',
        url: this.baseUrl,
        body: payload
    }); 
  }

  update(payload: N, id: string | number): Observable<M> {
    return this.restService.request<N, M>({
        method: 'PUT',
        url: this.baseUrl+'/'+id,
        body: payload
    }); 
  }

  get(payload: GetPage | any): Observable<T> {
    return this.restService.request<void, T>({
        method: 'GET',
        url: this.get_url(payload)
    }); 
  }

  getById(id: string | number,  payload?: GetPage | any): Observable<M> {
    return this.restService.request<void, M>({
        method: 'GET',
        url: this.get_url(payload, id)
    });
  }

  delete(id: string | number): Observable<void> {
    return this.restService.request<void, void>({
        method: 'DELETE',
        url: this.baseUrl+'/'+id
    }); 
  }

  private get_url(payload?: GetPage, id?: string | number) {
    let url = this.baseUrl+(id ? `/${id}` : '')    
    if (payload) {
      url = url+'?'
      if (payload?.page) url += `page=${payload.page}&`
      if (payload?.per_page) url += `per_page=${payload.per_page}&`
      if (payload?.name) url += `name=${payload.name}&`
      if (payload?.include) url += `include=${payload.include}&`
      if (payload?.params) url += payload.params
    }

    return url
  }
}