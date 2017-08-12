

// Code for platform detection
var isMaterial = Framework7.prototype.device.ios === false;
var isIos = Framework7.prototype.device.ios === true;

// Add the above as global variables for templates
Template7.global = {
  material: isMaterial,
  ios: isIos,
};

// A template helper to turn ms durations to mm:ss
// We need to be able to pad to 2 digits
function pad2(number) {
  if (number <= 99) { number = ('0' + number).slice(-2); }
  return number;
}


// A stringify helper
// Need to replace any double quotes in the data with the HTML char
//  as it is being placed in the HTML attribute data-context
function stringifyHelper(context) {
  var str = JSON.stringify(context);
  return str.replace(/"/g, '&quot;');
}

// Finally, register the helpers with Template7
Template7.registerHelper('stringify', stringifyHelper);

// If we need to use custom DOM library, let's save it to $$ variable:
var $$ = Dom7;

if (!isIos) {
  // Change class
  $$('.view.navbar-through').removeClass('navbar-through').addClass('navbar-fixed');
  // And move Navbar into Page
  $$('.view .navbar').prependTo('.view .page');
}

// Initialize app
var myApp = new Framework7({
  material: isIos? false : true,
  template7Pages: true,
  precompileTemplates: true,
  swipePanel: 'left',
  swipePanelActiveArea: '30',
  swipeBackPage: true,
  animateNavBackIcon: true,
  pushState: !!Framework7.prototype.device.os,
});

// Add view
var mainView = myApp.addView('.view-main', {
  // Because we want to use dynamic navbar, we need to enable it for this view:
  dynamicNavbar: true,
  domCache: true,
});

// Handle Cordova Device Ready Event
$$(document).on('deviceready', function deviceIsReady() {
  console.log('Device is ready!');
  //document.addEventListener("backbutton", function (e) {
  //      e.preventDefault();
   // }, false );
});

function register()
{
  mainView.router.load({
    template: myApp.templates.register
  });
}

function show_student_training_evaluations(student_training_id, reloadPrevious) {
  // If not using card as link, use this instead of the below
  //student_training_id = e.currentTarget.activeElement.dataset.item;

  access_token=localStorage.getItem('access_token');

 if(isNaN(student_training_id))
    student_training_id=localStorage.getItem('student_training_id');
  else
    localStorage.setItem('student_training_id',student_training_id);

  var url = 'http://assessment.express/api/student_training?student_training_id=' + student_training_id + '&access_token=' + access_token;

  myApp.showPreloader('Getting assessments...');
  $$.ajax({
    type: 'GET',
    dataType: 'json',
    processData: true,
    url: url,
    success: function assessmentsSuccess(resp) {
      myApp.hidePreloader();
      mainView.router.load({
        template: myApp.templates.student_training_evaluations,
        context: {
          student_training_evaluations: resp,
        },
        reloadPrevious: reloadPrevious
      });
    },
    error: function assesssmentsError(xhr, err) {
      myApp.hidePreloader();
      myApp.alert('An error has occurred', 'Get Assessments Error');
      console.error("Error on ajax call: " + err);
      console.log(JSON.stringify(xhr));
    }
  });
}

$$(document).on('click', '.refresh', function evaluationLink(e)
  {
    student_training_id=localStorage.getItem('student_training_id');
    show_student_training_evaluations(student_training_id, true);
  });


$$(document).on('click', '.student_training_evaluation_link', function evaluationLink(e)
  {
    show_student_training_evaluations(e.target.dataset.item, false);
  });

$$(document).on('click', '.back_to_assessment', function evaluationLink(e)
  {
    student_training_id=localStorage.getItem('student_training_id');
    show_student_training_evaluations(student_training_id, false);
  });

$$(document).on('click', '.back_to_training', function evaluationLink(e)
  {
    getTrainings(null);
  });

$$(document).on('click', '.take-assessment-button', function evaluationLink(e)
  {
    student_training_evaluation_id = e.target.dataset.item;
    goToNextQuestion(student_training_evaluation_id);
  });

$$(document).on('click', '.panel .training-link', function trainingLink() {
  getTrainings(null); });

$$(document).on('click', '.panel .favorites-link', function searchLink() {
  // @TODO fetch the favorites (if any) from localStorage
  var favorites = JSON.parse(localStorage.getItem('favorites'));
  mainView.router.load({
    template: myApp.templates.favorites,
    animatePages: false,
    context: {
      tracks: favorites,
    },
    reload: true,
  });
});



function signup(e)
{
  var url = 'http://assessment.express/api/student';
  //e.preventDefault();
  var formData = myApp.formToJSON('#register');
  var username = document.getElementById("username");
  var password = document.getElementById("password");
  localStorage.setItem('username', username);
  localStorage.setItem('password', password);
  myApp.showPreloader('Signing you up...');
  $$.ajax({
    type: 'POST',
    data : formData,
    processData: true,
    url: url,
    success: function signupSuccess(resp) {
      myApp.hidePreloader();
      if(resp.status == "success")
      {
        username = localStorage.getItem('username');
        password = localStorage.getItem('password');
        login(username, password);
      }
      else
      {
         myApp.alert('Please choose a different Username and  make sure Password is 6 characters long.', 'Could not sign up');
      }
    },
    error: function loginError(xhr, err) {
      myApp.hidePreloader();
      myApp.alert('Please check Username and Password.', 'Could not sign up');
      console.error("Error on ajax call: " + err);
      console.log(JSON.stringify(xhr));
    }
  });
}



function login(username, password) {
  var url = 'http://assessment.express/oauth/token';

  myApp.showPreloader('Signing you in...');
  $$.ajax({
    type: 'POST',
    data : {  grant_type : 'password',
              username : username,
              password : password },
    processData: true,
    url: url,
    success: function loginSuccess(resp) {
      myApp.hidePreloader();
      access_token = JSON.parse(resp).access_token;
      localStorage.setItem('access_token', access_token);
        var url = 'http://assessment.express/api/student_trainings?access_token=' + access_token;
        //e.preventDefault();

        myApp.showPreloader('Getting trainings...');
        $$.ajax({
          type: 'GET',
          dataType: 'json',
          processData: true,
          url: url,
          success: function trainingsSuccess(resp) {
            myApp.hidePreloader();
            localStorage.setItem('trainings',resp);
            mainView.router.load({
              template: myApp.templates.trainings,
              context: {
                trainings: resp,
              },
              reload: true,
              pushState: false
            });
          },
          error: function trainingsError(xhr, err) {
            myApp.hidePreloader();
            myApp.alert('An error has occurred', 'Get Trainings Error');
            console.error("Error on ajax call: " + err);
            console.log(JSON.stringify(xhr));
          }
        });
    },
    error: function loginError(xhr, err) {
      myApp.hidePreloader();
      myApp.alert('Please check Username and Password.', 'Could not login');
      console.error("Error on ajax call: " + err);
      console.log(JSON.stringify(xhr));
    }
  });
}

function getTrainings(e) {
  var url = 'http://assessment.express/api/student_trainings?access_token=' + access_token;
  //e.preventDefault();

  myApp.showPreloader('Getting trainings...');
  $$.ajax({
    type: 'GET',
    dataType: 'json',
    processData: true,
    url: url,
    success: function trainingsSuccess(resp) {
      myApp.hidePreloader();
      localStorage.setItem('trainings',trainings);
      mainView.router.load({
        template: myApp.templates.trainings,
        context: {
          trainings: resp,
        },
      });
    },
    error: function trainingsError(xhr, err) {
      myApp.hidePreloader();
      myApp.alert('An error has occurred', 'Get Trainings Error');
      console.error("Error on ajax call: " + err);
      console.log(JSON.stringify(xhr));
    }
  });
}

function goToNextQuestion(student_training_evaluation_id)
{
  myApp.hidePreloader();
  if(isNaN(student_training_evaluation_id))
    student_training_evaluation_id=localStorage.getItem('student_training_evaluation_id');
  else
    localStorage.setItem('student_training_evaluation_id',student_training_evaluation_id);
  //app.formToJSON('#query-form');
  access_token = localStorage.getItem('access_token');
  var url = 'http://assessment.express/api/student_training_evaluation?access_token=' + access_token + '&student_training_evaluation_id='+student_training_evaluation_id;
  //e.preventDefault();

  //myApp.showPreloader('Getting next question...');
  $$.ajax({
    type: 'GET',
    dataType: 'json',
    processData: true,
    url: url,
    success: function questionSuccess(resp) {
     // myApp.hidePreloader();
      template = null;
      student_training_evaluation_id = localStorage.getItem('student_training_evaluation_id');
      localStorage.setItem('question_id', resp.id);
      if(resp.status != 'empty') //if resp has an asnwer_type_id
      {
        if (resp.answer_type_id == '1')
        {
          template = myApp.templates.text_question;
        }
        else if (resp.answer_type_id == '2')
        {
          template = myApp.templates.radio_question;
        }
        else
        {
          template = myApp.templates.checkbox_question;
        }
        mainView.router.load({
            template: template,
            context: {
              question: resp,
              student_training_evaluation_id: student_training_evaluation_id,
            },
            pushState: false
        });
      }
      else
      {
        localStorage.setItem('student_training_evaluation_id',null);
        student_training_id=localStorage.getItem('student_training_id');
        show_student_training_evaluations(student_training_id, true);

        /*student_training_evaluations = JSON.parse(resp.student_training_evaluations);
        myApp.hidePreloader();
        mainView.router.load({
          template: myApp.templates.student_training_evaluations,
          context: {
            student_training_evaluations: resp.student_training_evaluations,
          },
        });*/
      }
    },
    error: function questionError(xhr, err) {
      myApp.hidePreloader();
      myApp.alert('An error has occurred', 'Get Question Error');
      console.error("Error on ajax call: " + err);
      console.log(JSON.stringify(xhr));
    }
  });
}


function add_training(e) {
  var url = 'http://assessment.express/api/student_trainings';
  //e.preventDefault();
  var formData = myApp.formToJSON('#submit_training_code');
  var training_code = formData.training_code;
  var access_token = localStorage.getItem('access_token');
  myApp.showPreloader('Adding training...');
  $$.ajax({
    type: 'POST',
    dataType: 'json',
    data : {  access_token : access_token,
              training_code : training_code },
    processData: true,
    url: url,
    success: function addTrainingSuccess(resp) {
      myApp.hidePreloader();
      if(resp.status && resp.status == "error")
      {
        myApp.alert(resp.message, 'Couldn\'t add training');
      }
      else
      {
        var access_token = localStorage.getItem('access_token');
        var url = 'http://assessment.express/api/student_trainings?access_token=' + access_token;
          myApp.showPreloader('Getting trainings...');
          $$.ajax({
            type: 'GET',
            dataType: 'json',
            processData: true,
            url: url,
            success: function trainingsSuccess(resp) {
              myApp.hidePreloader();
              localStorage.setItem('trainings',resp);
              mainView.router.load({
                template: myApp.templates.trainings,
                context: {
                  trainings: resp,
                },
              });
            },
            error: function addTrainingError(xhr, err) {
              myApp.hidePreloader();
              myApp.alert('An error has occurred', 'Get Trainings Error');
              console.error("Error on ajax call: " + err);
              console.log(JSON.stringify(xhr));
            }
          });
      }
    },
    error: function loginError(xhr, err) {
      myApp.hidePreloader();
      myApp.alert('An error has occurred', 'Add Training Error');
      console.error("Error on ajax call: " + err);
      console.log(JSON.stringify(xhr));
    }
  });
}

function submit_textanswer(e) {
  //e.preventDefault();
  var question_id = localStorage.getItem('question_id');
  var formData = myApp.formToJSON('#submit_textanswer_'+question_id);
  var text_answer =$$('#text_answer_'+question_id)[0].value;
  var student_training_evaluation_id = localStorage.getItem('student_training_evaluation_id');
  var url = 'http://assessment.express/api/student_training_evaluation';
  var access_token = localStorage.getItem('access_token');
  myApp.showPreloader('Answering question...');
  $$.ajax({
    type: 'POST',
    dataType: 'json',
    data : {  access_token : access_token,
              student_training_evaluation_id : student_training_evaluation_id,
              question_id : question_id,
              student_text_answer : text_answer },
    processData: true,
    url: url,
    success: goToNextQuestion,
    error: function answerError(xhr, err) {
      myApp.hidePreloader();
      myApp.alert('An error has occurred', 'Submit Answer Error');
      console.error("Error on ajax call: " + err);
      console.log(JSON.stringify(xhr));
    }
  });
}

function submit_radioanswer(e) {
  //e.preventDefault();
  var question_id = localStorage.getItem('question_id');
  var formData = myApp.formToJSON('#submit_radioanswer_'+ question_id);
  var answer_choice_id = formData.radio_answer;
   if(!isNaN(answer_choice_id))
   {
      var student_training_evaluation_id = localStorage.getItem('student_training_evaluation_id');
    var url = 'http://assessment.express/api/student_training_evaluation';
    var access_token = localStorage.getItem('access_token');
    myApp.showPreloader('Answering question...');
    $$.ajax({
      type: 'POST',
      dataType: 'json',
      data : {  access_token : access_token,
                student_training_evaluation_id : student_training_evaluation_id,
                question_id : question_id,
                answer_choice_id : answer_choice_id },
      processData: true,
      url: url,
      success: goToNextQuestion,
      error: function answerError(xhr, err) {
        myApp.hidePreloader();
        myApp.alert('An error has occurred', 'Submit Answer Error');
        console.error("Error on ajax call: " + err);
        console.log(JSON.stringify(xhr));
      }
    });
   }
}

function submit_checkanswer(e) {
 // e.preventDefault();
  var formData = myApp.formToJSON('#submit_checkanswer');
  var answer_choice_ids =  formData.check_answer;
  var question_id = localStorage.getItem('question_id');
  var student_training_evaluation_id = localStorage.getItem('student_training_evaluation_id');
  var url = 'http://assessment.express/api/student_training_evaluation';
  var access_token = localStorage.getItem('access_token');
  myApp.showPreloader('Answering question...');
  $$.ajax({
    type: 'POST',
    dataType: 'json',
    data : {  access_token : access_token,
              student_training_evaluation_id : student_training_evaluation_id,
              question_id : question_id,
              answer_choice_ids : answer_choice_ids },
    processData: true,
    url: url,
    success: goToNextQuestion,
    error: function answerError(xhr, err) {
      myApp.hidePreloader();
      myApp.alert('An error has occurred', 'Submit Answer Error');
      console.error("Error on ajax call: " + err);
      console.log(JSON.stringify(xhr));
    }
  });
  //return false;
}

function login_click(e) {
  var formData = myApp.formToJSON('#login');
  var username = formData.username;
  var password = formData.password;
  login(username, password);
}

$$(document).on('submit', '#login', function login_with_form(e) {
  var formData = myApp.formToJSON('#login');
  var username = formData.username;
  var password = formData.password;
  login(username, password);
});
//$$(document).on('submit', '#submit_checkanswer', submit_checkanswer);
//$$(document).on('submit', '#submit_textanswer', submit_textanswer);
//$$(document).on('submit', '#submit_training_code', add_training);

