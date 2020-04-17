import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormArray, FormControl, FormGroup } from '@angular/forms';
import { Observable } from 'rxjs';
import { distinctUntilChanged, filter, take } from 'rxjs/operators';

@Component({
  selector: 'my-app',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  count = 0;
  objData = [
    {
      id:'v1',
      options:[
        {
          oid: 'v1_op1'
        },
        {
          oid: 'v1_op2'
        }
      ]
    },
    {
      id:'v2',
      options:[
        {
          oid: 'v2_op1'
        },
        {
          oid: 'v2_op2'
        }
      ]
    }
  ]

  formArray = new FormArray([]);
  mainForm: FormGroup;
  viewformArray = new FormArray([]);
  eventOptionChange = false;

  mainFormResult: any;


  ngOnInit() {
    this.mainForm = new FormGroup({
      all: new FormControl(false)
    });

    this.mainForm.valueChanges.subscribe(
      value => {
        this.mainFormResult = value.views.map(view => view.options).flat().map(option => {
          if(option.checked){
            return option.id;
          }
        });
      }
    )

    this.objData.forEach(view => {
      this.addToFromArray(view, this.viewformArray);
    });
    this.mainForm.addControl('views', this.viewformArray);
    this.mainForm.controls.all.valueChanges.subscribe(
      value => {
        (this.mainForm.get('views') as FormArray)
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
    group.addControl('id', new FormControl(key));
    group.addControl('checked', new FormControl(false));

    // console.log('group in make',group.value);
    if(item.options){
      group.addControl('options', new FormArray([]));
      item.options.forEach(itemInclude => this.addToFromArray(itemInclude, group.get('options') as FormArray));
    }

    // console.log('group in make',group.value);
    formArray.push(group);

    // Setting changed checked conditions
      if(group.value.options){
        this.setCheckConditions(group);
      }
  }

  setCheckConditions(group: FormGroup) {
    // When group is true, all sub-controls are set to true
    this.setChildIfChecked(group);


    if(group.value.options){
      // When each sub control under group changes, check whether group changes
      (group.get('options') as FormArray)
        .controls
        .forEach(ctrl => this.setGroupCheckIfCtrlChecked(ctrl, group));
    }
  }

  setChildIfChecked(group: FormGroup) {
    if(group.value){
      (group.valueChanges as Observable<any>).pipe(
        distinctUntilChanged((x, y) => {
          // console.log('distinctUntil', group.value);
          // console.log(x.checked === y.checked, x, y);
          return x.checked === y.checked;
        }),
      ).subscribe(val => {
        console.log('changing views options', val, 
        this.eventOptionChange);
        (group.get('options') as FormArray)
          .controls
          .forEach(ctrl => {
              ctrl.patchValue({checked : val.checked}, {emitEvent: false});
          })
      });
    }
  }

  setGroupCheckIfCtrlChecked(ctrl: AbstractControl, group: FormGroup) {
    console.log(ctrl.value);
    group.valueChanges
      .subscribe(_ => {
        this.eventOptionChange = true;
        console.log('ctrl',ctrl.value, group.value)
        if(group.value.options.every(o => o.checked)){
          group.patchValue({ checked: true }, {emitEvent: false})
        } else {
          group.patchValue({ checked: false }, {emitEvent: false})
        }

      });
  }




}
