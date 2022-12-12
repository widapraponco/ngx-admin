import { Location } from "@angular/common";
import { HttpErrorResponse } from "@angular/common/http";
import { Component, ComponentRef, Injector, OnDestroy, OnInit, ViewContainerRef } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { NbDialogService, NbMenuService } from "@nebular/theme";
import { Store } from "@ngxs/store";
import { SwalComponent } from "@sweetalert2/ngx-sweetalert2";
import { BehaviorSubject, Observable } from "rxjs";
import { map, take, tap } from "rxjs/operators";
import { SweetAlertOptions } from "sweetalert2";
import { BaseData } from "../../../store/base-model";
import { Biodatas } from "../../../store/biodata/biodata";
import { BiodataState } from "../../../store/biodata/biodata.state";

@Component({
    selector: "base",
    template: ``
})
export class PageBaseComponent implements OnInit, OnDestroy {

    dialogService: NbDialogService 
    nbMenuService: NbMenuService
    _location: Location
    activateRoute: ActivatedRoute
    router: Router
    store: Store

    tag: string = ""

    vc: ViewContainerRef;

    swalHandler: SwalPopupHandler
    paramsObject$: Observable<any>

    get roles (): BaseData<Biodatas.Biodata>[] { return this.store.selectSnapshot(BiodataState.getRoles) }

    constructor(public injector: Injector) {
        this.dialogService = injector.get(NbDialogService)
        this.nbMenuService = injector.get(NbMenuService)
        this._location = injector.get(Location)
        this.vc = injector.get(ViewContainerRef)
        this.activateRoute = injector.get(ActivatedRoute)
        this.router = injector.get(Router)
        this.store = injector.get(Store)

        this.swalHandler = new SwalPopupHandler(this.vc)
    }

    ngOnInit(): void {
        this.paramsObject$ = this.activateRoute.queryParamMap
            .pipe(map((params) => {
                return { ...params.keys, ...params };
            }
        ));
    }

    public OnDelete(id: number | string) {
        this.swalHandler.deletePopup.instance.fire()
    }

    public back() {
        this._location.back()
    }

    public doRequest(request: Observable<any>, response?: BehaviorSubject<any>) {
        ResponseHelper.do(request, {
            next: (result) => this.OnSuccess(result, response),
            error: (error) => this.OnError(error, response),
            complete: () => this.OnComplete(response)
        } as BehaviorSubject<any>)
    }

    private OnSuccess(result: any, response: BehaviorSubject<any>) {
        this.swalHandler.successPopup.instance.fire()
        
        const subscribe = this.swalHandler.successPopup.instance.didClose.subscribe(() => {
            if (response) response.next(result)
            subscribe.unsubscribe()
        })
        // this.dialogService.open(DialogSuccessComponent)
    }

    private OnError(error: HttpErrorResponse, response: BehaviorSubject<any>) {             
        this.swalHandler.errorPopup.instance.swalOptions = {
            title: error?.error?.code ?? error.status,
            text: error?.error?.message ?? error.message
        }
        const subscribe = this.swalHandler.errorPopup.instance.confirm.asObservable()
            .pipe(tap(() => {
                if (response) response.error(error)
            }))
            .subscribe(() => {
                subscribe.unsubscribe()
            })

        this.swalHandler.errorPopup.instance.fire()
        // this.dialogService.open(DialogErrorComponent)
    }

    private OnComplete(response: BehaviorSubject<any>) {
        if (response) response.complete()
    }

    ngOnDestroy() {
        delete this.dialogService
    }
}

export class SwalPopupHandler {
    public successPopup: ComponentRef<SwalComponent>
    public errorPopup: ComponentRef<SwalComponent>
    public deletePopup: ComponentRef<SwalComponent>
    public alertPopup: ComponentRef<SwalComponent>

    constructor(vc: ViewContainerRef) {
        this.deletePopup = vc.createComponent(SwalComponent)
        this.deletePopup.instance.swalOptions = {
            title: "Hapus Data",
            text: "Apa anda benar ingin menghapus?",
            icon: "question",
            confirmButtonText: "Ya",
            cancelButtonText: "Batal",
            showCancelButton: true
        }

        this.successPopup = vc.createComponent(SwalComponent)
        this.successPopup.instance.swalOptions = {
            title: "Berhasil",
            text: "Perubahan berhasil dilakukan",
            icon: "success",
        }

        this.errorPopup = vc.createComponent(SwalComponent)
        this.errorPopup.instance.swalOptions = {
            title: "Error",
            text: "Terjadi kesalahan, coba ulangi kembali",
            icon: "error",
        }

        this.alertPopup = vc.createComponent(SwalComponent)
    }

    public alert(options: SweetAlertOptions, callback?: () => void) {
        this.alertPopup.instance.fire()
        this.alertPopup.instance.swalOptions = {
            icon: "warning",
            ...options,
        }
        callback && this.alertPopup.instance.didClose.pipe(take(1)).subscribe(() => {
            console.log('close');
            
            callback()
        })
    }
}

export class ResponseHelper {
    public static do(observable: Observable<any>, response: BehaviorSubject<any>) {
        observable.subscribe((result) => {
            // success response
            if (response) response.next(result)
        }, error => {
            // error respones
            if (response) response.error(error)
        }, () => {
            // complete response
            if (response) response.complete()
        })
    }
}