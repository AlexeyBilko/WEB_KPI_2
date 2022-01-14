import './App.css';
import React from 'react';
import sanitizeHtml from 'sanitize-html';


class App extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      isLoaded: false,
      fields: {},
      errors: {},
      msg: ''
    };

    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleValidation(){
    let fields = this.state.fields;
    let errors = {};
    let formIsValid = true;

    //Name
    if(!fields["name"]){
       formIsValid = false;
       errors.name = "Cannot be empty";
    }

    if(typeof fields["name"] !== "undefined"){
       if(!fields["name"].match(/^[a-zA-Z]+$/)){
          formIsValid = false;
          errors.name = "Only letters";
       }        
    }

    //Email
    if(!fields.email){
       formIsValid = false;
       errors.email = "Cannot be empty";
    }

    if(typeof fields["email"] !== "undefined"){
       let lastAtPos = fields["email"].lastIndexOf('@');
       let lastDotPos = fields["email"].lastIndexOf('.');

       if (!(lastAtPos < lastDotPos && lastAtPos > 0 && fields["email"].indexOf('@@') === -1 && lastDotPos > 2 && (fields["email"].length - lastDotPos) > 2)) {
          formIsValid = false;
          errors.email = "Email is not valid";
        }
    }  

    //Info
    if(!fields["info"]){
      formIsValid = false;
      errors.info = "Cannot be empty";
    }
    else if(fields["info"].length < 10){
      formIsValid = false;
      errors.info = "Less than 10 characters";
    }

   this.setState({errors: errors});
   return formIsValid;
}

  handleChange(field, e){
    let fields = this.state.fields;
    fields[field] = e.target.value;        
    this.setState({fields});
  }

  handleSubmit(event) {
    event.preventDefault();
    this.setState({isLoaded: true});
    
    if(!navigator.onLine){
      this.setState({msg: 'offline'})
      return;
    }

    this.setState({msg: ''});
    let sendedFine = false;
    let TooManyReq = false;
    if(this.handleValidation()) {
      const email = sanitizeHtml(this.state.fields.email);
      const name = sanitizeHtml(this.state.fields.name);
      const info = sanitizeHtml(this.state.fields.info);

      let url = "/api/sendEmail";
          const formData = {email,name,info}
          fetch(url, {
            method: 'POST',
            headers: {
            'Content-Type': 'application/json;charset=utf-8'
            },
            body: JSON.stringify(formData)
          })
          .then(function(response) {
              if (response.status === 200) {
                sendedFine = true;
              } else if(response.status === 402) {
                this.setState({msg: 'Validation Error'})
              } else if(response.status === 429){
                TooManyReq = true;
              }
              return response.json();
            } 
          )
          .then((response) => {
            if(response.success && sendedFine){
              this.setState({msg: 'sended'});
            }
            if(TooManyReq){
              this.setState({msg: 'toomanyreq'});
            }
            this.render();
          })
          .catch ((exception) => {
            this.setState({msg: 'offline'});
            this.setState({isLoaded: false});
          })

      this.setState({isLoaded: false});
    }
    else{
      this.setState({msg: 'error occured'});
      this.setState({isLoaded: false});
      this.render();
    }
    //todo setState -> msg, error
  }

  render() {
    if (this.state.isLoaded) {
      return (
        <>
          <div class="lds-spinner"><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div></div>
        </>
      )
    }
    else {
      return (
        <main>
          <div style={{display: this.state.msg === 'offline'? "block" : "none" }} className="errorSend">
            <label>Fetch error</label>
          </div>
          <div style={{display: this.state.msg === 'sended'  ? "block" : "none" }} className="successSend">
            <label>Success</label>
          </div>
          <div style={{ display: this.state.msg === 'toomanyreq'  ? "block" : "none" }} className="errorSend">
            <label>Unexpected error</label>
            <label>(Maybe you sended form too many times)</label>
          </div>
          <div style={{ display: this.state.msg === 'Validation Error' || this.state.errors["name"] || this.state.errors["email"] || this.state.errors["info"] ? "block" : "none" }} className="errorSend">
            <label>Validation Error occured</label>
          </div>
          <div className="container">
            <div className="inputs">
              <form onSubmit= {this.handleSubmit}>
                <div className="form_title">FORM "LAB_2"</div>
                <label>EMAIL</label>
                <input type="text" onChange={this.handleChange.bind(this, "email")} value={this.state.fields.email} placeholder="example@test.com" />
                <span style={{color: "red"}}>{this.state.errors["email"]}</span>
                <label>NAME</label>
                <input type="text" onChange={this.handleChange.bind(this, "name")} value={this.state.fields.name} placeholder="Only letters" />
                <span style={{color: "red"}}>{this.state.errors["name"]}</span>
                <label>INFO</label>
                <input type="text"  onChange={this.handleChange.bind(this, "info")} value={this.state.fields.info} placeholder="Min 10 charaters long" />
                <span style={{color: "red"}}>{this.state.errors["info"]}</span>
                <button type="submit">Send</button>
              </form>
            </div>
          </div>
        </main>
      )
    }
  }
}

export default App;
