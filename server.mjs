import express from "express";
import sql from "mssql";

const app = express();
const port = process.env.PORT || 8080;

app.use(express.static('public'))

app.get('/', async (req, res) => {
  // try {
  //   // const result = await connectAndQuery();

  // } catch (err) {
  //   res.send(err);
  //   return;
  // }
  // await new Promise(r => setTimeout(r, 1500));
  // res.send('Welcome to my server!');
  const result = await connectAndQuery();
  res.send(generateHTMLTable(result) + $`<br><a href="https://young-meadow-59910-528fca6fbb4b.herokuapp.com/verify">test test test</a>`);
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

const config = {
    user: 'CloudSA8c906187', // better stored in an app setting such as process.env.DB_USER
    password: 'Cipka150', // better stored in an app setting such as process.env.DB_PASSWORD
    server: 'werneros-wariatos.database.windows.net', // better stored in an app setting such as process.env.DB_SERVER
    port: 1433, // optional, defaults to 1433, better stored in an app setting such as process.env.DB_PORT
    database: 'werneros_wariatos', // better stored in an app setting such as process.env.DB_NAME
    authentication: {
        type: 'default'
    },
    options: {
        encrypt: true
    }
}

/*
    //Use Azure VM Managed Identity to connect to the SQL database
    const config = {
        server: process.env["db_server"],
        port: process.env["db_port"],
        database: process.env["db_database"],
        authentication: {
            type: 'azure-active-directory-msi-vm'
        },
        options: {
            encrypt: true
        }
    }

    //Use Azure App Service Managed Identity to connect to the SQL database
    const config = {
        server: process.env["db_server"],
        port: process.env["db_port"],
        database: process.env["db_database"],
        authentication: {
            type: 'azure-active-directory-msi-app-service'
        },
        options: {
            encrypt: true
        }
    }
*/

function generateHTMLTable(data) {
  let html = '<table border="1">';
  
  // Table header
  html += '<tr>';
  Object.keys(data[0]).forEach(key => {
    html += `<th>${key}</th>`;
  });
  html += '</tr>';
  
  // Table rows
  data.forEach(row => {
    html += '<tr>';
    Object.values(row).forEach(value => {
      html += `<td>${value}</td>`;
    });
    html += '</tr>';
  });
  
  html += '</table>';
  return html;
}

console.log("Starting...");

async function connectAndQuery() {
  var poolConnection = await sql.connect(config);

  console.log("Reading rows from the Table...");
  const query = `select * from test`;
  var resultSet = await poolConnection.request().query(query);
  return resultSet.recordset;

  console.log(`${resultSet.recordset.length} rows returned.`);

  // output column headers
  var columns = "";
  for (var column in resultSet.recordset.columns) {
      columns += column + ", ";
  }
  console.log("%s\t", columns.substring(0, columns.length - 2));

  // ouput row contents from default record set
  resultSet.recordset.forEach(row => {
      console.log("%s\t%s", row.CategoryName, row.ProductName);
  });

  // close connection only when we're certain application is finished
  poolConnection.close();
}