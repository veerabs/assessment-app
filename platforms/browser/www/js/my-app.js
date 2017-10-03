
var base_path = "";
var image_path = "http://assessment.express/assets/app/";

// Code for platform detection
var isMaterial = Framework7.prototype.device.ios === false;
var isIos = Framework7.prototype.device.ios === true;

// Add the above as global variables for templates
Template7.global = {
  material: isMaterial,
  ios: isIos,
  basepath: base_path,
  imagepath: image_path
};

Template7.registerHelper('radio_buttons', function (question, options){
  var ret = '';
  for (i = 1; i<=question.answer_choices ;i++)
  {
    ret = ret + '<li>' +
      '<label class="label-radio item-content">' +
        '<input type="radio" data-item="' + question.id + '" class="radio_answer_' + question.id + '" name="radio_answer" id="radio_answer_' + question.id + '_' + i + '" required value="' + i + '">' +
        '<div class="item-media">' +
          '<i class="icon icon-form-radio"></i>' +
        '</div>' +
        '<div class="item-inner">' +
          '<div class="">' + question['answer_choice_'+i] + '</div>' +
        '</div>' +
      '</label>' +
    '</li>';
  }
  return ret;
});

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
  swipeBackPage: false,
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
  //console.log('Device is ready!');
  access_token=localStorage.getItem('access_token');
  if(access_token != null)
  {
    loadTrainingPage(access_token);
  }
  else
  {
    mainView.router.load({
      template: myApp.templates.loginpage,
      animatePages: true,
      force: true
    });
  }

  $$('.img').each(function() {
     var $img = $$(this);
     var imgsrc = $img.src;
     var imgsrc2 =image_path + imgsrc;
     $img.attr('src',imgsrc2);
  });

});



function loadTrainingPage(access_token)
{
  var url = 'http://assessment.express/api/student_trainings?access_token=' + access_token;
  //e.preventDefault();

  myApp.showPreloader('Loading...');
  $$.ajax({
    type: 'GET',
    dataType: 'json',
    processData: true,
    url: url,
    success: function isLoggedIn(resp) {
      myApp.hidePreloader();
      getTrainings(null);
    },
    error: function statusError(xhr, err) {
      myApp.hidePreloader();
      localStorage.setItem('access_token',null);
    }
  });
}

function register()
{
  mainView.router.load({
    template: myApp.templates.register
  });
}

function show_student_training_question_sets(student_training_id, reload, reloadPrevious) {
  // If not using card as link, use this instead of the below
  //student_training_id = e.currentTarget.activeElement.dataset.item;

  access_token=localStorage.getItem('access_token');

 if(isNaN(student_training_id))
    student_training_id=localStorage.getItem('student_training_id');
  else
    localStorage.setItem('student_training_id',student_training_id);

  var url = 'http://assessment.express/api/student_training_questions?student_training_id=' + student_training_id + '&access_token=' + access_token;

  myApp.showPreloader('Getting assessments...');
  $$.ajax({
    type: 'GET',
    dataType: 'json',
    processData: true,
    url: url,
    success: function assessmentsSuccess(resp) {
      localStorage.setItem('student_training_question_sets',JSON.stringify(resp));
      resp = JSON.parse(localStorage.getItem('student_training_question_sets'));
      myApp.hidePreloader();
      mainView.router.load({
        template: myApp.templates.student_training_question_sets,
        context: {
          student_training_question_sets: resp,
        },
        reload: reload,
        reloadPrevious: reloadPrevious
      });
    },
    error: function assesssmentsError(xhr, err) {
      myApp.hidePreloader();
      myApp.alert('An error has occurred', 'Get Assessments Error');
      console.error("Error on ajax call: " + err);
      //console.log(JSON.stringify(xhr));
    }
  });
}

$$(document).on('click', '.refresh', function question_setLink(e)
{
  student_training_id=localStorage.getItem('student_training_id');
  show_student_training_question_sets(student_training_id, true, false);
});


$$(document).on('click', '.student_training_question_set_link', function question_setLink(e)
{
  show_student_training_question_sets(e.target.dataset.item, false, false);
});

$$(document).on('click', '.back_to_assessment', function question_setLink(e)
{
  student_training_id=localStorage.getItem('student_training_id');
  show_student_training_question_sets(student_training_id, false, false);
});

$$(document).on('click', '.back_to_training', function question_setLink(e)
{
  getTrainings(null);
});

$$(document).on('click', '.take-assessment-button', function question_setLink(e)
{
  student_training_question_set_id = e.target.dataset.item;
  goToNextLocalQuestion(student_training_question_set_id, false);
});

$$(document).on('click', '.panel .training-link', function trainingLink() {
  getTrainings(null); });


$$(document).on('click', '.panel .logout-link', function logoutLink() {
  localStorage.removeItem("access_token");;
  mainView.router.load({
    template: myApp.templates.loginpage,
    animatePages: true,
    force: true,
  });
});


function signup(e)
{
  var url = 'http://assessment.express/api/student';
  //e.preventDefault();
  var formData = myApp.formToJSON('#register');
  var username = formData['student[username]'];
  var password = formData['student[password]'];
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
      if(resp == "{\"status\":\"success\",\"code\":2000}")
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
      //console.log(JSON.stringify(xhr));
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
              reloadPrevious: true,
              pushState: false
            });
          },
          error: function trainingsError(xhr, err) {
            myApp.hidePreloader();
            myApp.alert('An error has occurred', 'Get Trainings Error');
            console.error("Error on ajax call: " + err);
            //console.log(JSON.stringify(xhr));
          }
        });
    },
    error: function loginError(xhr, err) {
      myApp.hidePreloader();
      myApp.alert('Please check Username and Password.', 'Could not login');
      //console.error("Error on ajax call: " + err);
      //console.log(JSON.stringify(xhr));
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
          reload: true,
          reloadPrevious: true,
          force: true
        },
      });
    },
    error: function trainingsError(xhr, err) {
      myApp.hidePreloader();
      myApp.alert('An error has occurred', 'Get Trainings Error');
      console.error("Error on ajax call: " + err);

      //console.log(JSON.stringify(xhr));
      localStorage.setItem('access_token',null);
      mainView.router.load({
        url: '/',

      });
    }
  });
}

function getNextQuestionFromStorage(student_training_question_set_id)
{
  var student_training_question_set = null;
  student_training_question_sets = JSON.parse(localStorage.getItem('student_training_question_sets'));
  for(i =0; i < student_training_question_sets.length; i ++)
  {
    if(student_training_question_sets[i].id == student_training_question_set_id)
    {
      student_training_question_set = student_training_question_sets[i];
    }
  }
  if(student_training_question_set != null)
  {
    student_answers = JSON.parse(localStorage.getItem('answers'));
    if(student_answers == null)
    {
      obj2 = '[]';
      student_answers = JSON.parse(obj2);
      localStorage.setItem('answers', JSON.stringify(student_answers));
    }
    training_questions = student_training_question_set.training_question_set.training_questions;
    for (j=0; j< training_questions.length; j++)
    {
      training_question_id = training_questions[j].id;
      matched = false;
      for (k=0;  k< student_answers.length; k++)
      {
        if(student_answers[k].training_question_id == training_question_id)
        {
          matched = true;
        }
      }
      if(!matched)
      {
        return training_questions[j];
      }
    }
  }
}

function goToNextLocalQuestion(student_training_question_set_id, reload)
{
  myApp.hidePreloader();
  if(isNaN(student_training_question_set_id))
   {
     student_training_question_set_id=localStorage.getItem('student_training_question_set_id');
   }
  else
  {
    localStorage.setItem('student_training_question_set_id',student_training_question_set_id);
  }

  template = null;
  resp = getNextQuestionFromStorage(student_training_question_set_id);
  if(resp == null)
  {
    endQuestionSet(student_training_question_set_id);
    localStorage.setItem('student_training_question_set_id',null);
    student_training_id=localStorage.getItem('student_training_id');
    show_student_training_question_sets(student_training_id, true, false);
  }
  else
  {
    localStorage.setItem('training_question_id', resp.id);
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
          student_training_question_set_id: student_training_question_set_id,
        },
        reload: reload
    });
  }
}

function endQuestionSet(student_training_question_set_id)
{
  var student_training_question_set = null;
  student_training_question_sets = JSON.parse(localStorage.getItem('student_training_question_sets'));
  for(i =0; i < student_training_question_sets.length; i ++)
  {
    if(student_training_question_sets[i].id == student_training_question_set_id)
    {
      student_training_question_sets.status = 2;
    }
  }
  localStorage.setItem('student_training_question_sets', JSON.stringify(student_training_question_sets));
}


function goToNextQuestion(student_training_question_set_id)
{
  myApp.hidePreloader();
  if(isNaN(student_training_question_set_id))
   {
     student_training_question_set_id=localStorage.getItem('student_training_question_set_id');
     reload = true;
   }
  else
  {
    localStorage.setItem('student_training_question_set_id',student_training_question_set_id);
    reload = false;
  }
  //app.formToJSON('#query-form');
  access_token = localStorage.getItem('access_token');
  var url = 'http://assessment.express/api/student_training_question_set?access_token=' + access_token + '&student_training_question_set_id='+student_training_question_set_id;
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
      student_training_question_set_id = localStorage.getItem('student_training_question_set_id');
      localStorage.setItem('training_question_id', resp.id);
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
              student_training_question_set_id: student_training_question_set_id,
            },
            reload: reload
        });
      }
      else
      {
        localStorage.setItem('student_training_question_set_id',null);
        student_training_id=localStorage.getItem('student_training_id');
        show_student_training_question_sets(student_training_id, true, true);

        /*student_training_question_sets = JSON.parse(resp.student_training_question_sets);
        myApp.hidePreloader();
        mainView.router.load({
          template: myApp.templates.student_training_question_sets,
          context: {
            student_training_question_sets: resp.student_training_question_sets,
          },
        });*/
      }
    },
    error: function questionError(xhr, err) {
      myApp.hidePreloader();
      myApp.alert('An error has occurred', 'Get Question Error');
      console.error("Error on ajax call: " + err);
      //console.log(JSON.stringify(xhr));
    }
  });
}


function setAnswerToStorage(student_training_question_set_id, training_question_id, answer_choice_id)
{
  var student_training_question_set = null;
  student_training_question_sets = JSON.parse(localStorage.getItem('student_training_question_sets'));
  for(i =0; i < student_training_question_sets.length; i ++)
  {
    if(student_training_question_sets[i].id == student_training_question_set_id)
    {
      student_training_question_set = student_training_question_sets[i];
    }
  }
  if(student_training_question_set != null)
  {
    student_answers = student_training_question_set.student_answer_choices;
    obj = '{' + '"id": 0, "student_training_question_set_id": ' + student_training_question_set_id +
          ', "training_question_id": ' + training_question_id + ', "answer_choice_id": ' + answer_choice_id + '}';
    student_answers[student_answers.length] = JSON.parse(obj);
    localStorage.setItem('student_training_question_sets',JSON.stringify(student_training_question_sets));

    answers = student_training_question_sets = JSON.parse(localStorage.getItem('answers'));
    if(answers == null) {
      obj2 = '[]';
      answers = JSON.parse(obj2);
    }
      answers[answers.length] = JSON.parse(obj);
      localStorage.setItem('answers',JSON.stringify(answers));
  }
}

function updateAnswerToStorage(training_question_id, answer_choice_id, student_answer_choice_id)
{
  var student_training_question_set = null;
  student_answers = JSON.parse(localStorage.getItem('answers'));
  for(i =0; i < student_answers.length; i ++)
  {
    if(student_answers[i].training_question_id == training_question_id && student_answers[i].answer_choice_id == answer_choice_id)
    {
      student_answers[i].id = student_answer_choice_id;
      localStorage.setItem('answers',JSON.stringify(student_answers));
      return;
    }
  }
}

function add_training(e) {
  training_code = e.target[0].value;
  e.preventDefault();
  var url = 'http://assessment.express/api/student_trainings';
  //var formData = myApp.formToJSON('#submit_training_code');
  //var training_code = formData.training_code;
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
                reload: true
              });
            },
            error: function addTrainingError(xhr, err) {
              myApp.hidePreloader();
              myApp.alert('An error has occurred', 'Get Trainings Error');
              console.error("Error on ajax call: " + err);
              //console.log(JSON.stringify(xhr));
            }
          });
      }
    },
    error: function loginError(xhr, err) {
      myApp.hidePreloader();
      myApp.alert('An error has occurred', 'Add Training Error');
      console.error("Error on ajax call: " + err);
      //console.log(JSON.stringify(xhr));
    }
  });
}

function submit_textanswer(e) {
  //e.preventDefault();
  var training_question_id = localStorage.getItem('training_question_id');
  var formData = myApp.formToJSON('#submit_radioanswer_'+ training_question_id);
  var text_answer =$$('#text_answer_'+training_question_id)[0].value;
   if(!isNaN(text_answer))
   {
      var student_training_question_set_id = localStorage.getItem('student_training_question_set_id');
      var url = 'http://assessment.express/api/student_training_question_set';
      var access_token = localStorage.getItem('access_token');
      setAnswerToStorage(student_training_question_set_id, training_question_id, text_answer);
      goToNextLocalQuestion(student_training_question_set_id, true);
  }
}

function submit_radioanswer(e) {
  //e.preventDefault();
  var training_question_id = localStorage.getItem('training_question_id');
  var formData = myApp.formToJSON('#submit_radioanswer_'+ training_question_id);
  var answer_choice_id = formData.radio_answer;
   if(!isNaN(answer_choice_id))
   {
      var student_training_question_set_id = localStorage.getItem('student_training_question_set_id');
      var url = 'http://assessment.express/api/student_training_question_set';
      var access_token = localStorage.getItem('access_token');
      setAnswerToStorage(student_training_question_set_id, training_question_id, answer_choice_id);
      goToNextLocalQuestion(student_training_question_set_id, true);
  }
}


function submit_checkanswer(e) {
 // e.preventDefault();
  var training_question_id = localStorage.getItem('training_question_id');
  var formData = myApp.formToJSON('#submit_radioanswer_'+ training_question_id);
  var answer_choice_ids = formData.check_answer;
   if(!isNaN(answer_choice_ids))
   {
      var student_training_question_set_id = localStorage.getItem('student_training_question_set_id');
      var url = 'http://assessment.express/api/student_training_question_set';
      var access_token = localStorage.getItem('access_token');
      setAnswerToStorage(student_training_question_set_id, training_question_id, answer_choice_ids);
      goToNextLocalQuestion(student_training_question_set_id, true);
  }
}

$$(document).on('submit', '#login', function login_with_form(e) {
  e.preventDefault();
  var username = e.target[0].value;
  var password = e.target[1].value;
  login(username, password);
});

//$$(document).on('submit', '#submit_checkanswer', submit_checkanswer);
//$$(document).on('submit', '#submit_textanswer', submit_textanswer);
$$(document).on('submit', '#submit_training_code', add_training);

setInterval(work, 15000);

function work(e) {
  syncAnswersToServer();
}


function syncAnswersToServer() {
  student_answers = JSON.parse(localStorage.getItem('answers'));
  if (student_answers != null)
  {
    access_token = localStorage.getItem('access_token');
    var url = 'http://assessment.express/api/student_training_question_set';
    for(i =0; i < student_answers.length; i ++)
    {
      if(student_answers[i].id == 0 )
      {
          $$.ajax({
            type: 'POST',
            dataType: 'json',
            data : {  access_token : access_token,
                      student_training_question_set_id : student_answers[i].student_training_question_set_id,
                      training_question_id : student_answers[i].training_question_id,
                      answer_choice_id : student_answers[i].answer_choice_id },
            processData: true,
            url: url,
            success: function saveAnswerAndGoToNextLocalQuestion(resp) {
              updateAnswerToStorage(resp.training_question_id, resp.answer_choice_id, resp.student_answer_choice_id);
              console.log("Answer written to server. Answer_choice_id:" + resp.student_answer_choice_id);
            },
            error: function answerError(xhr, err) {
              console.error("Error on ajax call: " + err);
            }
          });
      }
    }
  }
}
