import React from 'react';

///////////////////////////////////////////////////////////////////////////////
//Define global functions
///////////////////////////////////////////////////////////////////////////////

function generateUUID() {
    var d = new Date().getTime();
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = (d + Math.random()*16)%16 | 0;
        d = Math.floor(d/16);
        return (c=='x' ? r : (r&0x3|0x8)).toString(16);
    });
    return uuid;
}

///////////////////////////////////////////////////////////////////////////////
//Define global variables
///////////////////////////////////////////////////////////////////////////////
let scrollPositions = [];
let folderRoots = [{
  name: 'Projects',
  contents: [],
  selectStatus: '',
  index: 0,
  key: generateUUID()
},{
  name: 'Employees',
  contents: [],
  selectStatus: '',
  index: 1,
  key: generateUUID()
},{
  name: 'Contacts',
  contents: [],
  selectStatus: '',
  index: 2,
  key: generateUUID()
},{
  name: 'Archive',
  contents: [],
  selectStatus: '',
  index: 3,
  key: generateUUID()
}];

///////////////////////////////////////////////////////////////////////////////
//App that will be rendered
///////////////////////////////////////////////////////////////////////////////
class App extends React.Component{
  constructor(){
    super();
    this.state = {
      selectionMap: [],
      customContextMenu: {
        open: true,
        type: null,
        xCoord: 0,
        yCoord: 0
      }
    }
  }

  selectFolderRoot(event){
    if(event.target.getAttribute('class') === 'liSpan'){
      let reactId = event.target.parentNode.dataset.reactid;
      let objKey = reactId.substring(reactId.indexOf("$")+1);
      let selectedObj = {};
      //set and clear selection status for root
      for(let i = 0; i < this.props.folderRoots.length; i++){
        if(this.props.folderRoots[i].key === objKey){
          this.props.folderRoots[i].selectStatus = 'selected';
          //clear select status for child folders
          for(let j = 0; j < this.props.folderRoots[i].contents.length; j++){
            this.props.folderRoots[i].contents[j].selectStatus = '';
          }
          selectedObj = this.props.folderRoots[i];
        }else{
          this.props.folderRoots[i].selectStatus = '';
        }
      }

      this.setState({
        selectionMap: [selectedObj]
      });
    }
  }

  selectFolder(event){
    if(event.target.getAttribute('class') === 'folderSpan'){
      let reactId = event.target.parentNode.dataset.reactid;
      let objKey = reactId.substring(reactId.indexOf("$", reactId.indexOf("$")+1)+1);

      let found = false;
      let trail = [];
      function findSelection(currentLevel){
        for(let i = 0; i < currentLevel.contents.length; i++){
          trail.push(currentLevel.contents[i]);
          if(currentLevel.contents[i].key === objKey){
            currentLevel.contents[i].selectStatus = 'selected';
            found = true;
            //loop through remaining siblings and clear the selected selectStatus
            for(let j = 0; j < currentLevel.contents.length; j++){
              if(j !== i){
                currentLevel.contents[j].selectStatus = '';
              }
            }
            //loop through children and clear selected selectStatus
            for(let j = 0; j < currentLevel.contents[i].contents.length; j++){
              currentLevel.contents[i].contents[j].selectStatus = '';
            }
            break;
          }else{
            if(currentLevel.contents[i].contents.length > 0){
              findSelection(currentLevel.contents[i]);
              if(found){
                break;
              }
            }
          }
          trail.pop();
        }
        return trail;
      };
      let newSelection = findSelection(this.state.selectionMap[0]);
      newSelection.splice(0,0,this.state.selectionMap[0]);
      this.setState({
        selectionMap: newSelection
      });
    }
  }

  newFolder(event){
    if(this.state.selectionMap[0] != undefined){
      let found = false;
      let endKey = this.state.selectionMap[this.state.selectionMap.length - 1].key;
      function findSelection(selectedRoot){
        for(let i = 0; i < selectedRoot.contents.length; i++){
          if(selectedRoot.contents[i].key === endKey){
            found = true;
            selectedRoot.contents[i].contents.push({
              name: 'New Folder',
              selectStatus: '',
              textBox: false,
              key: generateUUID(),
              contents: []
            });
            break;
          }else{
            if(selectedRoot.contents[i].contents.length > 0){
              if(found){
                break;
              }
              findSelection(selectedRoot.contents[i]);
            }
          }
        }
      };

      let objKey = this.state.selectionMap[0].key;
      let selectedPropIndex = NaN;
      for(let i = 0; i < this.props.folderRoots.length; i++){
        if(this.props.folderRoots[i].key === objKey){
          selectedPropIndex = i;
          break;
        }
      }
      if(selectedPropIndex != NaN){
        if(this.state.selectionMap.length === 1){
          this.props.folderRoots[selectedPropIndex].contents.push({
            name: 'New Folder',
            selectStatus: '',
            textBox: false,
            key: generateUUID(),
            contents: []
          });
        }else{
          findSelection(this.props.folderRoots[selectedPropIndex]);
        }
        let oldMap = this.state.selectionMap;
        this.setState({
          selectionMap: oldMap
        });
      }else{
        console.log('weird error');
      }
    }
  }

  componentWillUpdate(){
    let folderTeirList = document.querySelectorAll('.folderLevel');
    scrollPositions = [];
    for(let i = 0; i < folderTeirList.length; i++){
      scrollPositions.push(folderTeirList[i].scrollTop);
    }
  }

  componentDidUpdate(){
    let folderTeirList = document.querySelectorAll('.folderLevel');
    for(let i = 0; i < folderTeirList.length; i++){
      folderTeirList[i].scrollTop = scrollPositions[i];
    }
    scrollPositions = [];
  }

  componentDidMount(){

  }

  render(){
    let styleContextMenu = {
      top: this.state.customContextMenu.yCoord + 10,
      left: this.state.customContextMenu.xCoord + 10
    };

    return(
      <div>

        <div className = 'col-xs-12'>
          <input id = 'folderSearch' type = 'text'></input>
          <button id = 'addFolderBtn' onClick = {this.newFolder.bind(this)}>New Folder</button>
          <button onClick = {console.log("Hi")}></button>
        </div>

        <div id = 'folderHousing'>

          <div className = 'folderRootsDiv'>
            <ul id = 'folderRoots' onClick = {this.selectFolderRoot.bind(this)}>
              {
                this.props.folderRoots.map((folderRoot) => {
                  return <li key = {folderRoot.key} className = {folderRoot.selectStatus + ' folderLi'}><span className = 'liSpan'>{folderRoot.name}</span></li>
                })
              }
            </ul>
          </div>

          {
            this.state.selectionMap.map((level, i) => {
              return <div key = {generateUUID()} className = 'folderLevel'>
                <ul onClick = {this.selectFolder.bind(this)}>
                  {
                    this.state.selectionMap[i].contents.map((item) => {
                      if(item.textBox === true){
                        return <li className = {item.selectStatus + ' folderLi'} key = {item.key}><input className = 'folderNameInput' type = 'text' defaultValue = {item.name}></input></li>
                      }else{
                        return <li className = {item.selectStatus + ' folderLi'} key = {item.key}><span className = 'folderSpan'>{item.name}</span></li>
                      }
                    })
                  }
                </ul>
              </div>
            })
          }
          <div key = {generateUUID()} className = 'folderLevel'></div>
        </div>

        {
          this.state.customContextMenu.open
            ? <div id="customContextMenu" className="menu" style = {styleContextMenu} onClick = {console.log("hi")}>
                <ul>
                  <li id="newFolder"><span>New Folder</span></li>
                </ul>
              </div>
            : null
        }

      </div>
    );
  }
}
React.render(<App folderRoots = {folderRoots}/>, document.getElementById('app'));
