import { AfterViewInit, Component, ComponentRef, Inject, Injector } from "@angular/core";
import { SwalComponent } from "@sweetalert2/ngx-sweetalert2";
import * as moment from "moment";
import { interval, Subscription } from "rxjs";
import { debounce, filter, scan } from "rxjs/operators";
import { GetPage, IDelete, IGet } from "../../../store/base-model";
import { PageBaseComponent } from "./page-base.component";  

@Component({
    selector: "table-base",
    template: ``
})
export class PageTableComponent extends PageBaseComponent {
    data = []
    loading = false
    
    constructor(public injector: Injector) {
        super(injector);
    }
}

export interface DeleteConstructor<T> {
    new (id: string | number, payload?: any): T;
}

export interface GetConstructor<T> {
    new (payload?: GetPage, id?: string | number): T;
}

export interface CreateUpdateConstructor<T> {
    new (payload: any, id?: string | number): T;
}

@Component({
    selector: "table-base",
    template: ``
})
export class PageTableStoreComponent<T extends IGet = null, O extends IDelete = null> extends PageBaseComponent implements AfterViewInit {
    data = []
    loading = false

    deleteSubscriber: Subscription;

    deleteCreator: new (id: number | string, payload?: any) => O
    getCreator: new (payload?: any, id?: string | number) => T

    deletePopup: ComponentRef<SwalComponent>

    id: string | number

    constructor(
        public injector: Injector, 
        @Inject('get')getCtor?: GetConstructor<T>, 
        @Inject('delete')delCtor?: DeleteConstructor<O>,
        @Inject('params') public pageObject: GetPage = {}
    ) {
        super(injector);

        this.deleteCreator = delCtor
        this.getCreator = getCtor
    }

    ngOnInit(): void {
        this.nbMenuService.onItemClick()
        .pipe(
            // tap(item => console.log(item)),
            filter(({ tag }) => tag === this.tag),
            // map(({ item: { title, id } }) => title),
        )
        .subscribe(result => {        
            if (result.item.title == 'Delete') this.OnDelete(result.item.data);
            if (result.item.title == 'Edit') this.OnEdit(result.item.data);
        });

        this.getData()
    }

    ngAfterViewInit(): void {
    }

    public getData() {
        this.loading = true
        this.id = this.activateRoute.snapshot.paramMap.get("id")
        
        let ownerId = null
        if (this.pageObject.useId) {            
            this.pageObject.params = `${this.pageObject.useId}=${this.id}`
        } else {
            ownerId = this.id
        }

        // console.log(this.pageObject);s
        this.store.dispatch(new this.getCreator(this.pageObject, ownerId))
            .subscribe(() => {
                this.loading = false
            });
    }

    public OnEdit(id: string | number): void {
        this.router.navigate(['./create-update', id], {relativeTo: this.activateRoute })
    }

    public OnDelete(id: string | number): void {
        this.swalHandler.deletePopup.instance.fire()
        this.deleteSubscriber = this.swalHandler.deletePopup.instance.confirm.asObservable()
        .subscribe(() => {
            this.doRequest(this.store.dispatch(new this.deleteCreator(id, this.pageObject)))
            this.deleteSubscriber.unsubscribe()
        })
    }

    currentParam: string
    filter(result) {
        const {search, status, dateRange} = result
        let params = this.pageObject.params ?? ''
        if (dateRange?.start && dateRange?.end) params += `start_date=${moment(dateRange.start).format('YYYY/MM/DD')}&end_date=${moment(dateRange.end).format('YYYY/MM/DD')}&`
        if (status) params += `status=${status}&`
        if (search?.length > 4) params += `search=${search}&`

        if (this.currentParam == params) return

        this.currentParam = params
    
        this.store.dispatch(new this.getCreator({...this.pageObject, params: params.length > 0 && params}))
            .pipe( 
                scan(i => ++i, 1),
                debounce(i => interval(200 * i))
            )
    }
}