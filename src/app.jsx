import React from 'react';
//
// Notes: if i default the folder names to text box, they are never right clicked so they are never set to the active object.
// posible fix: remove right clicked object state and replace with a focused object state.  this will be useful
// in the future to regive focus after render and for the scroll to the focused object after render.
//
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
      openFolderContextMenu: false,
      contextMenu: {
        xCoord: null,
        yCoord: null
      },
      divContextMenu: {
        open: false,
        xCoord: null,
        yCoord: null
      },
      rClickedObj: {},
      focusdObject: {}
    };
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
              textBox: true,
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
            textBox: true,
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

  changeName(event){
    let newName = event.target.value;
    this.state.rClickedObj.name = newName;
    this.state.rClickedObj.textBox = false;
    this.setState({
      openFolderContextMenu: false,
      contextMenu: {
        xCoord: null,
        yCoord: null
      },
      rClickedObj: {}
    });
  }

  folderContextMenuOpen(event){
    event.preventDefault();
    //console.log(event.pageX + " " + event.pageY);
    let target = event.target;
    let reactId = '';
    if(target.nodeName === 'SPAN'){
      reactId = target.parentNode.dataset.reactid;
    }else if(target.nodeName === 'LI'){
      reactId = target.dataset.reactid;
    }

    let objKey = reactId.substring(reactId.indexOf("$", reactId.indexOf("$")+1)+1);
    let found = false;
    let r = {};
    function findSelection(currentLevel){
      for(let i = 0; i < currentLevel.contents.length; i++){
        if(currentLevel.contents[i].key === objKey){
          found = true;
          r = currentLevel.contents[i];
        }else{
          if(currentLevel.contents[i].contents.length > 0){
            findSelection(currentLevel.contents[i]);
            if(found){
              break;
            }
          }
        }
      }
      return r;
    };

    r = findSelection(this.props.folderRoots[this.state.selectionMap[0].index]);
    this.setState({
      openFolderContextMenu: true,
      contextMenu: {
        xCoord: event.pageX,
        yCoord: event.pageY
      },
      rClickedObj: r
    });
  }

  divContextMenuOpen(event){
      event.preventDefault();

      this.setState({
        divContextMenu: {
          open: true,
          xCoord: event.pageX,
          yCoord: event.pageY
        }
      });
  }

  onTextFeildFocus(event){
    let target = event.target;
    let reactId = target.parentNode.dataset.reactid;
    let objKey = reactId.substring(reactId.indexOf("$", reactId.indexOf("$")+1)+1);
    let found = false;
    let r = {};
    function findSelection(currentLevel){
      for(let i = 0; i < currentLevel.contents.length; i++){
        if(currentLevel.contents[i].key === objKey){
          found = true;
          r = currentLevel.contents[i];
        }else{
          if(currentLevel.contents[i].contents.length > 0){
            findSelection(currentLevel.contents[i]);
            if(found){
              break;
            }
          }
        }
      }
      return r;
    };
    r = findSelection(this.props.folderRoots[this.state.selectionMap[0].index]);
    this.state.rClickedObj = r;
  }

  contextMenuOptions(event){
    let target = event.target;
    if(target.parentNode.getAttribute('id') === 'rename' || target.getAttribute('id') === 'rename'){
      if(this.state.rClickedObj.textBox === false){
        this.state.rClickedObj.textBox = true;
      }
    }else if(target.parentNode.getAttribute('id') === 'open' || target.getAttribute('id') === 'open'){
      console.log('open');
    }
  }

  closeContextMenu(event){
    if(this.state.openFolderContextMenu === true){
      this.setState({
        openFolderContextMenu: false,
        contextMenu:{
          xCoord: null,
          yCoord: null
        }
      });
    }
    if(this.state.divContextMenu.open === true){
      this.setState({
        divContextMenu: {
          open: false,
          xCoord: null,
          yCoord: null
        }
      });
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
    window.addEventListener('click', this.closeContextMenu.bind(this), false);
  }

  myStringify(){
    /*let stringObj = JSON.stringify(this.props.folderRoots);
    console.log(stringObj);*/
    console.log(Array.prototype);
  }

  render(){
    let styleFolderContextMenu = {
      top: this.state.contextMenu.yCoord + 10,
      left: this.state.contextMenu.xCoord + 10
    };
    let styleDivContextMenu = {
      top: this.state.divContextMenu.yCoord + 10,
      left: this.state.divContextMenu.xCoord + 10
    };
    return(
      <div>

        <div className = 'col-xs-12'>
          <input id = 'folderSearch' type = 'text'></input>
          <button id = 'addFolderBtn' onClick = {this.newFolder.bind(this)}>New Folder</button>
          <button onClick = {this.myStringify.bind(this)}></button>
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
              return <div key = {generateUUID()} className = 'folderLevel' onContextMenu = {this.divContextMenuOpen.bind(this)}>
                <ul onClick = {this.selectFolder.bind(this)}>
                  {
                    this.state.selectionMap[i].contents.map((item) => {
                      if(item.textBox === true){
                        return <li className = {item.selectStatus + ' folderLi'} key = {item.key}><input className = 'folderNameInput' type = 'text' defaultValue = {item.name} onFocus = {this.onTextFeildFocus.bind(this)} onBlur = {this.changeName.bind(this)}></input></li>
                      }else{
                        return <li onContextMenu = {this.folderContextMenuOpen.bind(this)} className = {item.selectStatus + ' folderLi'} key = {item.key}><span className = 'folderSpan'>{item.name}</span></li>
                      }
                    })
                  }
                </ul>
              </div>
            })
          }
          <div key = {generateUUID()} className = 'folderLevel' onContextMenu = {this.divContextMenuOpen.bind(this)}></div>
        </div>

        {
          this.state.openFolderContextMenu
            ? <div id="customMenu" className="menu" style = {styleFolderContextMenu} onClick = {this.contextMenuOptions.bind(this)}>
                <ul>
                  <li id="rename"><span>Rename</span></li>
                  <li id="open"><span>Open</span></li>
                </ul>
              </div>
            : null
        }

        {
          this.state.divContextMenu.open
            ? <div id="divCustomMenu" className="menu" style = {styleDivContextMenu} onClick = {this.contextMenuOptions.bind(this)}>
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

///////////////////////////////////////////////////////////////////////////////
//Event Listeners
///////////////////////////////////////////////////////////////////////////////
