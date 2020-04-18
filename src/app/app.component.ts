import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormArray, FormControl, FormGroup } from '@angular/forms';
import { Observable } from 'rxjs';
import { distinctUntilChanged, filter, take, map } from 'rxjs/operators';

@Component({
  selector: 'my-app',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {

  // main object data for dynamic form
  objData = [
    {
      id:'view_a',
      name: 'A',
      options:[
        {
          oid: 'option_a1',
          name:'a1'
        },
        {
          oid: 'option_a2',
          name:'a2'
        }
      ]
    },
    {
      id:'view_a',
      name: 'B',
      options:[
        {
          oid: 'option_b1',
          name:'b1'
        },
        {
          oid: 'option_b2',
          name: 'b2'
        }
      ]
    }
  ]

  selectOptionsForm: FormGroup;
  viewformArray = new FormArray([]);
  selectOptionsFormResult: any;


  ngOnInit() {
    this.selectOptionsForm = new FormGroup({
      all: new FormControl(false)
    });

    this.selectOptionsForm.valueChanges.subscribe(
      value => {
        this.selectOptionsFormResult = value.views.map(view => view.options).flat().filter(o=>o.checked).map(option => {
          if(option.checked){
            return option.id;
          }
        });
      }
    )

    this.objData.forEach(view => {
      this.addToFromArray(view, this.viewformArray);
    });
    this.selectOptionsForm.addControl('views', this.viewformArray);
    this.selectOptionsForm.controls.all.valueChanges.subscribe(
      value => {
        (this.selectOptionsForm.get('views') as FormArray)
        .controls
        .forEach(ctrl => {
            ctrl.patchValue({checked : value});
        })
      }
    )
  }



  addToFromArray(item: any, formArray: FormArray) {
    // Recursively complete all forms
    const group = new FormGroup({});
    const key = item.id || item.oid;
    if(item.id){
      group.addControl('id', new FormControl(key));
      group.addControl('checked', new FormControl(false));
      // this control to show if any of its childd selected.
      group.addControl('anyOptionChecked', new FormControl(false));
    } else {
      group.addControl('id', new FormControl(key));
      group.addControl('checked', new FormControl(false));
    }

    if(item.options){
      group.addControl('options', new FormArray([]));
      item.options.forEach(itemInclude => this.addToFromArray(itemInclude, group.get('options') as FormArray));
    }

    formArray.push(group);

    // Setting changed checked conditions
      if(group.value.options){
        this.setCheckConditions(group);
      }
  }

  setCheckConditions(group: FormGroup) {
    // When group changed, all sub-controls are set to true or false
    this.setChildIfChecked(group);


    if(group.value.options){
      // When each sub control under group changes, change parent values.
      (group.get('options') as FormArray)
        .controls
        .forEach(ctrl => this.setGroupCheckIfCtrlChecked(ctrl, group));
    }
  }

  setChildIfChecked(group: FormGroup) {
    let viewChanged = false;
    (group.controls.checked.valueChanges as Observable<any>)
    .pipe().subscribe(val => {
      group.patchValue({ anyOptionChecked: val}, {emitEvent: false});
      (group.get('options') as FormArray)
        .controls
        .forEach(ctrl => {
            ctrl.patchValue({checked : val}, {emitEvent: false});
        });
      const siblingViewSelected = 
        (this.selectOptionsForm.get('views') as FormArray)
          .controls
          .map(ctrl => ctrl.get('checked').value)
          .every(checked => checked)
        this.selectOptionsForm.patchValue({ all: siblingViewSelected}, {emitEvent: false});
    });
  }

  setGroupCheckIfCtrlChecked(control: AbstractControl, group: FormGroup) {
    const anyTrue = () =>
        (group.get('options') as FormArray).controls
            .map(ctrl => ctrl.get('checked').value)
            .some(checked => checked);

    const allTrue = () =>
        (group.get('options') as FormArray).controls
            .map(ctrl => ctrl.get('checked').value)
            .every(checked => checked);

    const allFalse = () =>
        (group.get('options') as FormArray).controls
            .map(ctrl => ctrl.get('checked').value)
            .every(checked => !checked);

    const anyFalse = () =>
        (group.get('options') as FormArray).controls
            .map(ctrl => ctrl.get('checked').value)
            .some(checked => !checked);

    control.valueChanges.subscribe(val => {
        if (!val.checked && anyFalse()) {
            // if any option un checked un check its parents and set anyOptionChecked false
            group.patchValue(
                { checked: false },
                { emitEvent: false }
            );
            this.selectOptionsForm.patchValue(
                { all: false },
                { emitEvent: false }
            );
        }
        if (!val.checked && allFalse()) {
            // if all option un checked un check its parent anyOPtionSelected false
            group.patchValue(
                { anyOptionChecked: false },
                { emitEvent: false }
            );
        } 
        if (val.checked && allTrue()) {
            // if all option checked check its parents
            group.patchValue(
                { checked: true, anyOptionChecked: true },
                { emitEvent: false }
            );
            const siblingSelected = (this.selectOptionsForm.get(
                'views'
            ) as FormArray).controls
                .map(ctrl => ctrl.get('checked').value)
                .every(checked => checked);
            if (siblingSelected) {
                this.selectOptionsForm.patchValue(
                    { all: true },
                    { emitEvent: false }
                );
            }
        }
        if (val.checked && anyTrue()) {
            // if any option checked check its parent anyOPtionSelected true
            group.patchValue(
                { anyOptionChecked: true },
                { emitEvent: false }
            );
        }
    });
  }
}
