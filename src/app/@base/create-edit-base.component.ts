import { Component, Injector, Input, Inject, TemplateRef, ViewChild, AfterViewInit } from "@angular/core";
import { FormControl, NgForm, Validators } from "@angular/forms";
import { Store } from "@ngxs/store";
import { BehaviorSubject, Observable, Subject } from "rxjs";
import { map } from "rxjs/operators";
import { GetPage, ICreateUpdate, IGet } from "../../../store/base-model";
import { FileUpload } from "../components/upload-file.component";
import { PageBaseComponent } from "./page-base.component";
import { CreateUpdateConstructor, GetConstructor } from "./page-table.component";
import { parseISO } from 'date-fns';

@Component ({
    selector: 'create-edit-base',
    template: ``,
})
export class CreateEditBaseComponent extends PageBaseComponent {
  @Input() templateRef: TemplateRef<any>
  @Input() data: any
  @Input() title: string = ""

  @ViewChild('f') f: NgForm;

  save: Subject<any> = new Subject<any>()
  hasRender: Subject<any> = new Subject<any>()

  OnSave: Observable<any> = this.save.asObservable()
  OnRender: Observable<any> = this.hasRender.asObservable()

  constructor(public injector: Injector) {
    super(injector)
  }

  cancel() {
    // not implemented
  }

  onSubmit(f: NgForm) {
    this.save.next(f)
  }

  onChangeFile(e: any) {
    console.log(e);
  }
}

@Component ({
  selector: 'create-edit-store-base',
  template: ``,
})

export class CreateEditStoreBaseComponent<T extends ICreateUpdate, O, G extends IGet, M> extends PageBaseComponent implements AfterViewInit {
  @Input() templateRef: TemplateRef<any>
  @Input() data: any
  @Input() title: string = ""

  @ViewChild('f') f: NgForm;

  save: Subject<any> = new Subject<any>()
  hasRender: Subject<any> = new Subject<any>()

  OnSave: Observable<any> = this.save.asObservable()
  OnRender: Observable<any> = this.hasRender.asObservable()
  store: Store

  id: string | number
  parentId: string | number

  createUpdateCreator: new (payload?: any, id?: string | number) => T
  getCreator: new (payload?: GetPage, id?: string | number) => G

  selected: M = {} as M

  constructor(public injector: Injector, @Inject('state') public stateKey: string, @Inject('create')createCtor?: CreateUpdateConstructor<T>, @Inject('get')getCtor?: GetConstructor<G>, @Inject('params') public pageObject: GetPage = {}) {
    super(injector)
    this.store = injector.get(Store)

    this.createUpdateCreator = createCtor
    this.getCreator = getCtor

    this.id = this.activateRoute.snapshot.paramMap.get("id")
  }

  ngAfterViewInit(): void {
    if (this.id && this.getCreator) {
      const nestedKey = this.stateKey.split('.')
      const stateKey = nestedKey[0]
      nestedKey.splice(0, 1)

      this.store.dispatch(new this.getCreator(this.pageObject, this.id))
        // .pipe(map(data => {
        //   const item: M = this.getData(data[stateKey].response.items[0], nestedKey.join('.'))          
        //   return item
        // }))
        .subscribe((item) => {
          // if (item) {
          //   this.selected = item        
          //   this.setFormValue()
          // } else {
          //   this.back()
          // }
        })
    }
  }

  cancel() {
    // not implemented
  }

  initFormValue(data: any) {
    // timeout used to recognize f as NgForm, cause null if directly set value
    setTimeout(() => {
      Object.keys(data).forEach(
        key => {
          // check if a date
          const value = parseISO(data[key]).toString() === 'Invalid Date' ? data[key] : parseISO(data[key])
          if (this.f.controls[key]) this.f.controls[key].setValue(value)}
      )
    }, 100)
  }

  setFormValue() {
    if (this.selected) this.initFormValue(this.selected)
  }

  onSubmit(f: NgForm) {
    const value = f.value as O
    const doSave = this.store.dispatch(new this.createUpdateCreator(value, this.id))
    this.doRequest(doSave, {
        next: (result) => this.successSubmit(result),
        error: (error) => this.errorrSubmit(error),
        complete: () => this.completeSubmit()
      } as BehaviorSubject<any>
    )
  } 

  completeSubmit() {}
  successSubmit(result) {}
  errorrSubmit(error) {}

  onChangeFile(e: FileUpload) {
    this.f.form.addControl(e.id, new FormControl(e.file, Validators.required))
  }

  private getData(i: any, str: string) {
    const keys = str.length > 0 ? str.split('.') : []    
    let obj = i
    return keys.reduce((p, c) => {
      // console.log(c);
      
      p = obj[c]
      obj = p
      return obj
    }, obj)
  }
}