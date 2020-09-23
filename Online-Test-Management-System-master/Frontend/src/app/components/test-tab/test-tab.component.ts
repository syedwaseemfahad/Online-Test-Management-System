import { DOCUMENT } from '@angular/common';
import { Component, HostListener, Inject, Injector, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AttemptExamService } from 'src/app/services/attempt-exam.service';
import swal from 'sweetalert';
import { Test } from 'src/app/models/user.model';

@Component({
  selector: 'app-test-tab',
  templateUrl: './test-tab.component.html',
  styleUrls: ['./test-tab.component.css']
})
export class TestTabComponent implements OnInit {


  step: number = 1;
  testId: number;
  userId: number;
  SelectOption:FormGroup;
  questionList: any[];
  totalAttempts: number = 0;
  numberOfQuestion:number[] = [];
  answer:number[] = [];
  checked: boolean = false;
  currentQuestion: number  = 0;
  timeLeftSecond: number = 60;
  timeLeftMin: number = 0;
  timeOutAlert: boolean = false;
  answerStatus:number[] = [];
  value: number = 1;
  interval;
  userName: string;
  test?: Test;
  testTitle?:string;

   constructor(@Inject(DOCUMENT) private document: any,private formBuilder:FormBuilder,private injector : Injector,private services:AttemptExamService,) { 
     
     this.userName = sessionStorage.getItem('username')
     let route=injector.get(ActivatedRoute)
     route.params.subscribe(params=>{
         this.testId = params['testId'];
     })

     this.services.getActiveTests(this.userName, this.testId).subscribe((data)=>{
       this.setTest(data);
       console.log(this.test);
       
       this.timeLeftMin = this.test.testDuration - 1;

       

       if(this.timeLeftMin < 2){
          this.timeOutAlert = true
       }
       for(let i = 0; i < this.test.totalQuestion; i++){
         this.numberOfQuestion[i] = i;
         this.answer[i] = 0;
         this.answerStatus[i] = -1;
       }
     },
     (err)=>{
       console.log(err);
       alert(err.error.details);
       this.step = 1
       window.close()
     })
 
   }  
   elem;

   @HostListener('window:beforeunload', ['$event'])
   onWindowClose(event: any): void {
     
     if(this.step == 3){
      event.preventDefault();
      event.returnValue = false;
     this.submitTestAnswer();
     }
     
  }

  setTest(data) {
    this.test = data;
    this.testTitle = this.test.testTitle;
  }

   openFullscreen() {
    if (this.elem.requestFullscreen) {
      this.elem.requestFullscreen();
    } else if (this.elem.mozRequestFullScreen) {
      /* Firefox */
      this.elem.mozRequestFullScreen();
    } else if (this.elem.webkitRequestFullscreen) {
      /* Chrome, Safari and Opera */
      this.elem.webkitRequestFullscreen();
    } else if (this.elem.msRequestFullscreen) {
      /* IE/Edge */
      this.elem.msRequestFullscreen();
    }
    this.step++;
  }


   ngOnInit() {
  this.elem = document.documentElement;
  this.SelectOption = this.formBuilder.group({
    option: ['', Validators.required]
  })
}


nextStep(){
  
  this.services.getAllQuestion(this.userName, this.testId).subscribe((data)=>{
    this.setQuestionList(data);
    console.log(data);
    this.step++;
    this.startTimer();
    console.log(this.questionList[0]);
    
  },
  (err)=>{
    console.log("Error...Occurs");
    alert(err.error.details);
    window.close();
  })
}

setQuestionList(data){

  this.questionList = data
}

visitQuestion(num: number){
  if(this.answer[this.currentQuestion] == 0){
    this.SelectOption.controls['option'].reset();
    this.answerStatus[this.currentQuestion] = -1;
  }
  else{
    this.answerStatus[this.currentQuestion] = 1;
    
  }
    this.currentQuestion = num;
   
}

startTimer(){
  this.interval = setInterval(()=>{
   
     if(this.timeLeftSecond > 0){
      this.timeLeftSecond--;
     }
     else{
      this.timeLeftMin--;
      this.timeLeftSecond = 60;
      if(this.timeLeftMin == 1){
        if(this.step == 3){
          swal("Last 2 Minute Left... Complete Fast.");
        }
        this.timeOutAlert = true;
       }
      if(this.timeLeftMin == -1){
        if(this.step==3)
          this.submitTestAnswersTimeOut();
        else
          window.close
      }
    }
  },1000)




}

clearOption(){
  if(this.answer[this.currentQuestion] == 0){
    swal("Not attempted ...!");
    this.SelectOption.controls['option'].reset();
    return;
  }
  this.answerStatus[this.currentQuestion] = -1;
  this.answer[this.currentQuestion] = 0;
  this.SelectOption.controls['option'].reset();
  this.totalAttempts--;
}
setChooseOption(){
  if(this.answer[this.currentQuestion] != 0 && this.SelectOption.controls.option.invalid){
    this.totalAttempts--;
  }
  if(this.SelectOption.controls.option.invalid){
    swal("No Option Selected ...!");
    this.answer[this.currentQuestion] = 0;
    this.answerStatus[this.currentQuestion] = -1;
    return;
  }
  if(this.answer[this.currentQuestion] == 0){
    this.totalAttempts++;
  }
  this.answerStatus[this.currentQuestion] = 1;
  
  this.answer[this.currentQuestion] = this.SelectOption.controls.option.value;
  this.SelectOption.controls['option'].reset();
  
}

previousQuestion(){
  if(this.answer[this.currentQuestion] == 0){
    this.SelectOption.controls['option'].reset();
    this.answerStatus[this.currentQuestion] = -1;
  }
  else{
    this.answerStatus[this.currentQuestion] = 1;
    
  }
  this.currentQuestion--;
  
}
nextQuestion(){
  if(this.answer[this.currentQuestion] == 0){
    this.SelectOption.controls['option'].reset();
    this.answerStatus[this.currentQuestion] = -1;
  }
  else{
    this.answerStatus[this.currentQuestion] = 1;
  }
  this.currentQuestion++;
  console.log(this.answer);
}
submitTestAnswer(){
  if(this.step != 3){
    return;
  }
  console.log(this.step)
  var getAnswer = {
    answer:this.answer, 
    userName:this.userName, 
    testId:this.testId 
 }; 
  console.log(getAnswer.answer)
  this.services.setTestAnswer(getAnswer).subscribe((data)=>{
    console.log(data);
 },
 (err)=>{
   console.log(err);
   swal(err.error.message);
 })
 this.step++;
}
submitTestAnswersTimeOut(){
  if(this.step == 3){
    console.log(this.step)
    console.log(this.answer)
     var getAnswer = {
    answer:this.answer, 
    userName:this.userName, 
    testId:this.testId
 }
    console.log(this.step)
    this.services.setTestAnswer(getAnswer).subscribe((data)=>{
      console.log(data)
 },
 (err)=>{
   console.log(err);
   swal(err.error.message);
 })
 swal("Time Out!!! \nTest Is Submitted...");
 this.step=4
}
}

Review(){
  console.log(this.answer)
  swal({
    title: "Are you sure Want to Submit?",
    text: "Total Attempted: " + this.totalAttempts + " out of " + (this.test.totalQuestion)+" questions.",
    icon: "warning",
    buttons: [true, true],
    dangerMode: true,
  })
  .then((willDelete) => {
    if (willDelete) { this.submitTestAnswer() }
    else{ return }
  }
  )
}


}
