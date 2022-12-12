import { Component, Inject, Injector, Input, TemplateRef } from "@angular/core";
import { NbDialogRef } from "@nebular/theme";
import { Observable, Subject } from "rxjs";
import { ICreateUpdate } from "../../../store/base-model";
import { CreateEditBaseComponent, CreateEditStoreBaseComponent } from "./create-edit-base.component";
import { CreateUpdateConstructor } from "./page-table.component";

@Component ({
    selector: 'create-edit-dialog-base',
    template: ``,
})
  
export class CreateEditDialogBaseComponent<T> extends CreateEditBaseComponent {
  @Input() templateRef: TemplateRef<any>
  @Input() data: any
  @Input() title: string = ""

  save: Subject<any> = new Subject<any>()
  hasRender: Subject<any> = new Subject<any>()

  OnSave: Observable<any> = this.save.asObservable()
  OnRender: Observable<any> = this.hasRender.asObservable()

  constructor(public injector: Injector, public dialogRef: NbDialogRef<T>) {
    super(injector)
  }

  cancel() {
    this.dialogRef.close();
  }
}

@Component ({
  selector: 'create-edit-dialog-store-base',
  template: ``,
})

export class CreateEditDialogStoreBaseComponent<T, N extends ICreateUpdate = null, O = null, G = null, M = null> extends CreateEditStoreBaseComponent<N, O, G, M> {
  @Input() templateRef: TemplateRef<any>
  @Input() data: any
  @Input() title: string = ""

  constructor(public injector: Injector, public dialogRef: NbDialogRef<T>, @Inject('state') stateKey?: string, @Inject('create') createCtor?: CreateUpdateConstructor<N>, @Inject('get') getCtor?: CreateUpdateConstructor<G>) {
    super(injector, stateKey, createCtor, getCtor)
  }

  cancel() {
    this.dialogRef.close();
  }
}