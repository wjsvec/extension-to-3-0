const vscode = require('vscode');
const taos = require("@tdengine/client");



/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

    console.log('Congratulations, your extension "extension-to-3-0" is now active!');
    let tree_base = new TreeBaseShower();
	let panel;
	let connect_td;

    let refresh_tree = vscode.commands.registerCommand('nodeDependencies.refreshEntry', () => {
            tree_base.refresh();

        }
    );	
    context.subscriptions.push(refresh_tree);


    let log_baselist = vscode.commands.registerCommand('extension-to-3-0.helloWorld', async (host,user,password,config,port) => {
        try {

            console.log(host,user,password,config,port);
			const answer = "Yes";
            // const answer = await vscode.window.showInformationMessage('Log in?', "Yes", "No");

            if (answer === 'Yes') {

                var conn = taos.connect({
                    host: host,
                    user: user,
                    password: password,
                    config: config,
                    port: port,
                });
                var cursor = conn.cursor(); // Initializing a new cursor
                console.log(cursor);
				vscode.window.showInformationMessage("Log in!!!");
				panel.dispose();

                var data_list = await get_database_list(cursor);
				console.log(data_list);
				let data_dict = {};

				// 这段运行慢暂时注释
				for (let db of data_list){
					let t1 = await executeSql("use "+db, 0,cursor);
					let t2 = await get_base_table(cursor);
					data_dict[db] = await t2;
					console.log(data_dict);
				}
				
				
				var promise= cursor.query("SHOW DATABASES;", true);
				

                promise.then(function (result) {

                    let aa = "org"
                    aa = String(result["data"][2]["data"][0]);
                    let dict_t ={ "demo": [ "t"]};
                    dict_t['test'] = ["d250"];
					console.log(data_dict);
					console.log(dict_t)
                    tree_base = new TreeBaseShower(data_dict);

                    vscode.window.registerTreeDataProvider("nodeDependencies", tree_base)
                    //Close a connection

                });
				connect_td = conn;
				console.log('Close a connection');
				// conn.close(); // close connection
				
                

			} else {

            }
        } catch (e) {
            console.log(e)
			vscode.window.showInformationMessage("Wrong config");

        }


    });

	context.subscriptions.push(log_baselist);
    context.subscriptions.push(
        vscode.commands.registerCommand('extension-to-3-0.login', () => {
            panel = vscode.window.createWebviewPanel(
                'logIn',
                'Log in',
                vscode.ViewColumn.One,
                {
                    enableScripts: true
                }
            );

            panel.webview.html = getLoginContent();

            // Handle messages from the webview
            panel.webview.onDidReceiveMessage(
                message => {
                    switch (message.command) {
                        case 'alert':
                            //   vscode.window.showErrorMessage(message.textttt);
                            // vscode.window.showInformationMessage(message.host + message.username + message.password + message.config + Number(message.port));
                            vscode.commands.executeCommand("extension-to-3-0.helloWorld", message.host, message.username, message.password, message.config, Number(message.port));
							
                            return;
                    }
                },
                undefined,
                context.subscriptions
            );
        })
    );

	

    let disposable3 = vscode.commands.registerCommand('nodeDependencies.checkTable', async (node) => {
        const panel = vscode.window.createWebviewPanel(
            'checkTable',
            'Checking Table',
            vscode.ViewColumn.One,
            {
                // Enable scripts in the webview
                enableScripts: true
            }
        );
		console.log(node['frombase'],node['label']);
		console.log(connect_td['_host'],connect_td['_user'],connect_td['_password'],connect_td['_config'],connect_td['_port']);
        console.log(connect_td);
        var conn = taos.connect({
            host: connect_td['_host'],
            user: connect_td['_user'],
            password: connect_td['_password'],
            config: connect_td['_config'],
            port: connect_td['_port'],
        });
        var cursor = conn.cursor()
        let query_text = await executeQuery("select * from "+node['frombase']+"."+node['label']+" limit 0,10",cursor,true)
        panel.webview.html = await getWebviewContent(cursor,node['frombase'],node['label'],query_text);
        console.log('12313231312312'+query_text);
        cursor.close();
    });
    context.subscriptions.push(disposable3);
}

// this method is called when your extension is deactivated
function deactivate() {
}

module.exports = {
    activate,
    deactivate
}

async function executeQuery(sql, cursor,if_print = false) {
    var start = new Date().getTime();
    var promise = cursor.query(sql, true);
    var end = new Date().getTime();
    let res = '';
	
    let test = await promise.then(function (result) {
        if (if_print){
			res = printSql(sql, result != null, (end - start));
        	console.log(result);
		}
		
        result.pretty();

        return res;
    });
    return test

}

async function executeSql(sql, affectRows, cursor) {
    var start = new Date().getTime();
    var promise = cursor.execute(sql);
    var end = new Date().getTime();
	
	printSql(sql, promise == affectRows, (end - start));
	
    
}

function printSql(sql, succeed, cost) {
    console.log("[ " + (succeed ? "OK" : "ERROR!") + " ] time cost: " + cost + " ms, execute statement ====> " + sql);
    return "[ " + (succeed ? "OK" : "ERROR!") + " ] time cost: " + cost + " ms, execute statement ====> " + sql;
}

function getLoginContent() {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cat Coding</title>
</head>
<body>
    <img src="https://www.taosdata.com/wp-content/uploads/2022/02/site-logo.png" width="300" />
    <h1 id="lines-of-code-counter">login</h1>
	<p id="demo">请输入配置参数</p>

	
	
	
    <table >
	<tr><td>host:</td><td><input id="host" type="text" value= "127.0.0.1" name="host"><br> </td></tr>
	<tr><td>user:</td>  <td><input id="username" type="text" value= "root" name="user"><br> </td></tr>
	<tr><td>Password: </td><td><input id = 'password' type="password" value= "taosdata" name="password"><br> </td></tr>
	<tr><td>config:</td><td><input id="config" type="text" value= "/etc/taos" name="config"><br> </td></tr>
	<tr><td>port:</td><td><input id="port" type="text" value= "0" name="port"><br></td></tr>
</table>
	<button type="button" onclick="myFunction()">提交</button>

    <script>
	const vscode = acquireVsCodeApi();
    function myFunction()
    {   
        
        vscode.postMessage({
            command: 'alert',
            textttt: 'Try submit ' + document.getElementById("username").value+' times',
			host: document.getElementById("host").value,
			username :document.getElementById("username").value,
			password :document.getElementById("password").value,
			config:document.getElementById("config").value,
			port : document.getElementById("port").value
        });
		document.getElementById("demo").innerHTML="配置有误，请重新尝试!";
    }
    </script>
</body>
</html>`;
}

async function getWebviewContent(cursor,frombase,table,qt) {
    
	
	

    return `<!DOCTYPE html>
  <html lang="en">
  <head>
	  `+frombase +"--"+ table+ `
  </head>
  <body>
     <h2 >`+qt+`</h2>
	  <h1 >`+''+`</h1>
  
	  <script>
		  const counter = document.getElementById('lines-of-code-counter');
  
		  let count = 0;
		  setInterval(() => {
			  counter.textContent = count++;
		  }, 100);
	  </script>
  </body>
  </html>`;
}

class TreeBaseShower {

    constructor(treedata) {
        this.treedata = treedata;
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
    }

	delete(){
		this.treedata = {};
		this.refresh();
	}

    refresh() {
        console.log("refresh");
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element) {
        return element;
    }

    getChildren(element) {

        if (element) {
            let t1 = [];
            let arr = element.tba;

            for (let i = 0, len = arr.length; i < len; i++) {

                t1.push(new TableNode(arr[i], vscode.TreeItemCollapsibleState.None,element.label));

            }
            return t1;

        } else {
            let t1 = [];
            let dict = this.treedata;
            for (var db in dict) {

                t1.push(new BaseNode(db, vscode.TreeItemCollapsibleState.Collapsed, dict[db]))

            }

            return t1;
        }

        // return [t1];
    }
}

class BaseNode extends vscode.TreeItem {
    constructor(label, collapsibleState, table_arry) {
        super(label, collapsibleState);
        this.tba = table_arry;
		this.contextValue = "basenode";
    }
}

class TableNode extends vscode.TreeItem {
    constructor(label, collapsibleState,frombase) {
        super(label, collapsibleState);
		this.frombase = frombase;
		this.contextValue = "tablenode";
    }
}

const sleep = (ms) =>
    new Promise(resolve => setTimeout(resolve, ms));


async function get_database_list(cursor){
	let  sql_res = cursor.query("SHOW DATABASES;", true);
	let data_list = [];
	let test = await sql_res.then(function (result) {
		for (let i =0;i<(result["data"]).length;i++){
			data_list.push(  String(result["data"][i]["data"][0])  );
		}
		
	}).then(
		function(result){
			data_list = data_list.slice(2);
			for (let db of data_list){
				
				
			}
			return data_list;
			
		}
	);
	
	
	return test;
}

async function get_base_table(cursor){
	// let res = []
	var promise = cursor.query("SHOW TABLES;", true);
    
	
    let res = await promise.then(function (result) {
        let res = []
		for (let i = 0; i < result['data'].length;i++){
			if(i <10){
				// console.log(result['data'][i]['data'][0]);
				res.push(result['data'][i]['data'][0]);
			}
			
		}
		return res
		
		
		
        
    });
	console.log(res);
	return res
}
