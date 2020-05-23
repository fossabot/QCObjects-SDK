'use strict';
Package('org.quickcorp.controllers',[
  Class('GridController',Controller,{
    dependencies:[],
    component:null,
    _new_:function (o){
      this.__new__(o);
    },
    done: function (){
      var controller=this;
      var s = _DOMCreateElement('style');
      var templateRows = 'auto '.repeat(this.rows);
      var templateCols = 'auto '.repeat(this.cols);
      var className = 'grid'+this.__instanceID.toString();
      s.innerHTML = '.'+className+' { \
                        display: grid; \
                        grid-template-rows: '+templateRows+'; \
                        grid-template-columns: '+templateCols+'; \
                        margin:0 auto; \
                    }';
      this.component.body.append(s);
      var d = _DOMCreateElement('div');
      d.className=className;
      this.component.body.append(d);
      logger.debug('GridComponent built');

    }
  }),
  Class('DataGridController',Controller,{
    dependencies:[],
    component:null,
    _new_:function (o){
      var controller=this;
      //TODO: Implement
      logger.debug('DataGridController INIT');
    },
    addSubcomponents:function (){
      var controller = this;
      controller.component.subcomponents = [];
      controller.component.body.innerHTML = '';
      logger.debug(_DataStringify(controller.component.data));
      try {
        var subcomponentClass = controller.component.body.getAttribute('subcomponentClass');
        if (subcomponentClass != null){
          var offset;
          var limit;
          var pagesNumber;
          var list = [...controller.component.data];
          var paginateIn = controller.component.body.getAttribute('paginate-in');
          paginateIn = (paginateIn !== null)?(paginateIn):("client");
          if (paginateIn === "client"){
            var page = controller.component.body.getAttribute('page-number');
            page = (isNaN(page))?(-1):(page);
            if (page !== -1){
              pagesNumber = controller.component.body.getAttribute('total-pages');
              pagesNumber = (isNaN(pagesNumber))?(1):(pagesNumber);
              offset = (list.length/pagesNumber)*page;
              limit = offset+(list.length/pagesNumber);
            } else {
              offset = 0;
              limit = list.length;
              pagesNumber = 0;
            }
            list = list.slice(offset,limit);
          } else {
            offset = 0;
            limit = list.length;
            pagesNumber = 0;
          }
          list.map(
            function (record,dataIndex){
                try {
                  var _body = _DOMCreateElement('component');
                  _body.setAttribute("name",ClassFactory(subcomponentClass).name);
                  _body.setAttribute("shadowed",ClassFactory(subcomponentClass).shadowed);
                  _body.setAttribute("cached",ClassFactory(subcomponentClass).cached);
                  var subcomponent = New(ClassFactory(subcomponentClass),{
                    data:record,
                    templateURI:ComponentURI({
                      'COMPONENTS_BASE_PATH':CONFIG.get('componentsBasePath'),
                      'COMPONENT_NAME':ClassFactory(subcomponentClass).name,
                      'TPLEXTENSION':CONFIG.get('tplextension'),
                      'TPL_SOURCE':'default' //here is always default in order to get the right uri
                    }),
                    body:_body
                  });
                  subcomponent.done = controller.component.done.bind(subcomponent);
                  try {
                    if (subcomponent){
                      subcomponent.data.__dataIndex = dataIndex;
                      if (controller.component.data.hasOwnProperty('length')){
                        subcomponent.data.__dataLength = controller.component.data.length;
                      }
                      logger.debug('adding subcomponent to body');
                      controller.component.body.append(subcomponent.body);
                      try {
                        controller.component.subcomponents.push(subcomponent);
                      }catch (e){
                        logger.debug('ERROR LOADING SUBCOMPONENT IN DATAGRID');
                      }
                    } else {
                      logger.debug('ERROR LOADING SUBCOMPONENT IN DATAGRID');
                    }
                  }catch (e){
                    logger.debug('ERROR LOADING SUBCOMPONENT IN DATAGRID');
                  }

                } catch (e) {
                  logger.debug('ERROR LOADING SUBCOMPONENT IN DATAGRID');
                }
            }
          );
        } else {
          logger.debug('NO SUBCOMPONENT CLASS IN COMPONENT');
        }

      } catch (e){
        logger.debug('No data for component');
      }
    },
    done:function (){
      var controller = this;
      var componentInstance = controller.component;
      logger.debug('DataGridController DONE');
      var serviceClass = controller.component.body.getAttribute('serviceClass');
      if (serviceClass != null){
        var offset;
        var limit;
        var paginateIn = componentInstance.body.getAttribute('paginate-in');
        paginateIn = (paginateIn !== null)?(paginateIn):("client");
        if (paginateIn === "server"){
          var page = componentInstance.body.getAttribute('page-number');
          page = (isNaN(page))?(-1):(page);
          var pagesNumber;
          if (page !== -1){
            pagesNumber = controller.component.body.getAttribute('total-pages');
            pagesNumber = (isNaN(pagesNumber))?(1):(pagesNumber);
            offset = (list.length/pagesNumber)*page;
            limit = offset+(list.length/pagesNumber);
            // send params in jsonrpc 2.0 style
            componentInstance.serviceData = (typeof componentInstance.serviceData !== "undefined")?(componentInstance.serviceData):({});
            componentInstance.serviceData.params = (typeof componentInstance.serviceData.params !== "undefined")?(componentInstance.serviceData.params):({});
            componentInstance.serviceData.params.offset = offset;
            componentInstance.serviceData.params.limit = limit;
          }
        }

        var service = serviceLoader(New(ClassFactory(serviceClass),{
            data:componentInstance.serviceData
        })).then(
          (successfulResponse)=>{
            // This will show the service response as a plain text
            logger.debug('DONE SERVICE COMPONENT');
            successfulResponse.service.JSONresponse = JSON.parse(successfulResponse.service.template);
            if (typeof successfulResponse.service.JSONresponse.result !== "undefined"){
              logger.debug(_DataStringify(successfulResponse.service.JSONresponse.result));
              componentInstance.data = successfulResponse.service.JSONresponse.result;
            } else {
              componentInstance.data = successfulResponse.service.JSONresponse;
            }
            controller.addSubcomponents();

          },
          (failedResponse)=>{

          }).catch ((e)=>{
            logger.debug('Something went wrong when calling the service from: '+serviceClass);
          });

      }

    }

  }),
  Class('ModalController',Controller,{
    dependencies:[],
    component:null,
    _new_:function (o){
      this.__new__(o);
      var controller=this;
      //TODO: Implement
    },
    done: function (){
      var component = this.component;
      component.body.innerHTML = component.body.innerHTML.replace('/{{content}}/g',component.submodal.template);

    }
  }),
  Class('FormValidations',Controller,{
    getDefault (fieldName){
      return function (fieldName,dataValue, element){
        var _regex = {
                      name:"^[a-zA-Z]+(([',. -][a-zA-Z ])?[a-zA-Z]*)*$",
                      email:"^([A-Za-z0-9]+)\@([A-Za-z0-9]+)\.([A-Za-z0-9]+)$"
                    };
        var _pattern_ = (element.getAttribute('pattern') || _regex[fieldName]);
        var pattern = new RegExp(_pattern_);
        return pattern.test(dataValue)
      }
    }
  }),
  Class('FormController',Controller,{
    dependencies:[],
    component:null,
    serviceClass:'',
    formSettings:{
      backRouting:'#',
      loadingRouting:'#loading',
      nextRouting:'#signupsuccessful'
    },
    hasValidation(element){
      var fieldName = element.getAttribute('data-field');
      var _hasValidation = false;
      if (typeof this.validations !== 'undefined'
        && this.validations.hasOwnProperty(fieldName)){
        _hasValidation = true;
      }
      return _hasValidation;
    },
    isInvalid (element){
      var controller = this;
      var _isInvalid = false;
      var fieldName = element.getAttribute('data-field');
      var dataValue = this.component.data[fieldName];

      var _execValidation = function (fieldName, dataValue, element){
        return (typeof controller.validations !== 'undefined'
        && controller.validations.hasOwnProperty(fieldName)
        && controller.validations[fieldName].call(controller).call(controller,fieldName,dataValue, element));
      };

      if (typeof this.validations !== 'undefined' && (
        !_execValidation(fieldName, dataValue, element)
      )){
        _isInvalid = true;
      }
      return _isInvalid;
    },
    isValid (element){
      return !this.isInvalid(element);
    },
    save: function (){
      var controller = this;
      if (controller.serviceClass !== ''){
        location.href=controller.formSettings.loadingRouting;
        var service = serviceLoader(New(ClassFactory(controller.serviceClass),{
            data:controller.component.data
        })).then(
          (successfulResponse)=>{
            // This will show the service response as a plain text
            console.log('DONE SERVICE COMPONENT');
            try{
              console.log(successfulResponse.service.JSONresponse);
            }catch (e){
                // no json
            }
            location.href=controller.formSettings.nextRouting;

          },
          (failedResponse)=>{
            location.href=controller.formSettings.backRouting;
          });
      } else {
        logger.debug('No service name declared on serviceClass property')
      }

    },
    formSaveTouchHandler: function (){
      logger.debug('Saving data...');
      var controller = this;
      controller.component.executeBindings();
      if (controller.formValidatorModal!=null){
        var componentElementFields = controller.component.body.subelements('*[data-field]');
        var fieldsToValidate = componentElementFields.filter(
          f => controller.hasValidation.call(controller,f)
        );

        var _labelledby = function (parentElement, element){
          var _arialabelledby = function (parentElement, element){
            return (element.getAttribute('aria-labelledby') !== null)?(element.getAttribute('aria-labelledby').split(' ').map(
              e => parentElement.subelements(`#${e}`).map(_e => _e.innerHTML)
            ).join(' ')):(null)
          }

          return (_arialabelledby(parentElement, element)
                  || element.getAttribute('aria-label')
                  || element.getAttribute('placeholder')
                  || element.getAttribute('name')
                  || element.getAttribute('data-field') );
        };

        var _ariatitle = function (element){
          return (element.getAttribute('title') || element.getAttribute('aria-title') || '');
        }

        var invalidFields = fieldsToValidate.filter(f=>controller.isInvalid(f));
        if (invalidFields.length>0){
          var validationMessage = `
<details>
    <summary>Please verify the following incorrect fields:</summary>
    <ul>
      <div>
      ${invalidFields.map(element => '<li><div>'+_labelledby(controller.component.body,element)+'</div><div>'+_ariatitle(element)+'</div></li>').join('')}
      </div>
    </ul>
</details>
`;
          controller.formValidatorModal.body.subelements('.validationMessage')[0].innerHTML=validationMessage;
          controller.formValidatorModal.modal();
        } else {
          controller.save();
        }
      } else {
        logger.debug('Unable to find the modal validator...');
        logger.debug('Saving data...');
        controller.save();
      }
    },
    _new_:function (o){
      var controller = this;
      this.__new__(o);
      var controller=this;
      controller.component = o.component;
      controller.component = controller.component.Cast(FormField);
    },
    done: function (){
      logger.debugEnabled=true;
      var controller=this;
      try {
        controller.component.createBindingEvents();
        var modalBody = _DOMCreateElement('div');
        modalBody.className='modal_body';
        controller.formValidatorModal = New(ModalComponent,{
          body:modalBody,
          subcomponents:[],
          data:{
            content:'<div class="validationMessage"></div>'
          }
        });

        Tag('.modal_body').map(e=>document.body.removeChild(e));
        document.body.append(controller.formValidatorModal);

      } catch (e){
        logger.debug('Unable to create the modal');
      }
      controller.onpress('.submit',function (e){
        e.preventDefault();
        controller.formSaveTouchHandler();
      });

    }
  }),
  Class('SwaggerUIController',Controller,{
	  dependencies:[],
	  component:null,
		startSwaggerUI: function (){
			// Begin Swagger UI call region
			const ui = SwaggerUIBundle({
				url: CONFIG.get('swagger-ui-url','https://petstore.swagger.io/v2/swagger.json'),
				dom_id: '#'+CONFIG.get('swagger-ui-dom_id','swagger-ui'),
				deepLinking: true,
				presets: [
					SwaggerUIBundle.presets.apis,
					SwaggerUIStandalonePreset
				],
				plugins: [
					SwaggerUIBundle.plugins.DownloadUrl
				],
				layout: "StandaloneLayout"
			})
			// End Swagger UI call region

			window.ui = ui

		},
		done: function (){
			var controller = this;
      controller.component.body.innerHTML = '<div id="'+CONFIG.get('swagger-ui-dom_id','swagger-ui')+'"></div>';
			var swaggerUIPackagePath = CONFIG.get('swagger-ui-package-path',"node_modules/swagger-ui-dist/");

			this.dependencies.push(New(SourceJS,{
				url:swaggerUIPackagePath+'swagger-ui-standalone-preset.js',
				external:CONFIG.get('swagger-ui-external',false)
			}));
			this.dependencies.push(New(SourceCSS,{
				url:swaggerUIPackagePath+'swagger-ui.css',
				external:CONFIG.get('swagger-ui-external',false)
			}));
			this.dependencies.push(New(SourceJS,{
				url:swaggerUIPackagePath+'swagger-ui-bundle.js',
				external:CONFIG.get('swagger-ui-external',false),
				done:function (){
					controller.startSwaggerUI();
				}
			}));
		}
	})
]);
