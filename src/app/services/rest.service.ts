import { HttpClient, HttpParameterCodec, HttpParams, HttpRequest } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import * as moment from 'moment';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { isUndefinedOrEmptyString } from '../utils/common-utils';
import { environment } from '../../environments/environment';
import { Rest } from '../@store/models/rest';
import { HttpErrorReporterService } from './http-error-reporter.service';

@Injectable({
  providedIn: 'root',
})
export class RestService {
  constructor(
    protected http: HttpClient,
    protected httpErrorReporter: HttpErrorReporterService,
  ) {}

  handleError(err: any): Observable<any> {
    this.httpErrorReporter.reportError(err);
    return throwError(err);
  }

  request<T, R>(
    request: HttpRequest<T> | Rest.Request<T>,
    config?: Rest.Config,
    api?: string,
  ): Observable<R> {
    config = config || ({} as Rest.Config);
    api = environment.apiUrl;
    const { method, params, ...options } = request;
    const { observe = Rest.Observe.Body, skipHandleError } = config;
    const url = this.removeDuplicateSlashes(api + request.url);
    return this.http
      .request<R>(method, url, {
        observe,
        ...(params && {
          params: this.getParams(params, config.httpParamEncoder),
        }),
        ...options,
        body: this.formatBody(options.body)
      } as any)
      .pipe(catchError(err => (skipHandleError ? throwError(err) : this.handleError(err))));
  }

  private getParams(params: Rest.Params, encoder?: HttpParameterCodec): HttpParams {
    const filteredParams = Object.keys(params).reduce((acc, key) => {
      const value = params[key];
      if (isUndefinedOrEmptyString(value)) return acc;
    //   if (value === null && !this.options.sendNullsAsQueryParam) return acc;
      acc[key] = value;
      return acc;
    }, {});
    return encoder
      ? new HttpParams({ encoder, fromObject: filteredParams })
      : new HttpParams({ fromObject: filteredParams });
  }

  private formatBody(body: any) {    
    if (!body) return null

    if (!(body instanceof FormData)) {
      Object.keys(body).forEach(key => {
        if (body[key] instanceof Date) body[key] = moment(body[key]).format('YYYY-MM-DD hh:mm:ss')
      })
      return body
    }

    return body
  }

  private removeDuplicateSlashes(url: string): string {
    return url.replace(/([^:]\/)\/+/g, '$1');
  }
}