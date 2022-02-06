/*
Consideraciones:
- Se adjunta archivo bancosolar.sql, el cual contiene las queries de creación de la BD y TABLAS.
- Para la tabla usuarios, el nombre se dejó como UNIQUE, para que no se permitan ingrear usuarios duplicados.
- Para la tabla usuarios, se agregó un campo adicional llamado VIGENTE de tipo BOOLEANO y con valor por defecto TRUE, con el fin de poder administras el listado de transferencias, esto va de la mano con el DELETE el cual no elimina el registro, sino que lo modifica, cambiando el valor del campo VIGENTE a FALSE.
- El postUsario, valida que si el usuario no existe lo crea, si el usuario existe pero fue eliminado, vuelve a cambiar la condición del campo VIGENTE a TRUE en la tabla USUARIOS, si el usuario existe y se encuentra vigente, envía por consola mensaje "Usuario existe en la BD y se encuentra vigente".
- Para la tabla de transferencias se realizó a través de queries con tablas temporales y JOIN.
- Me falto desarrollar de mejor manera la administración de los errores.
*/

const url = require("url");
const http = require("http");
const fs = require("fs");
const { postUsuario, getUsuarios, putUsuario, deleteUsuario, postTransferencia, getTransferencias } = require("./funciones.js")

http
  .createServer(async (req, res) => {
    
    if (req.url === "/" && req.method == 'GET') {
      fs.readFile("index.html", "utf8", (err, data) => {
        if (err) {
          console.log('Error al leer el index: ', err.code);
          res.end();
        } else {
          res.setHeader("content-type", "text/html");
          res.end(data);
        }
      });
    }

    if (req.url.startsWith("/usuario") && req.method == "POST") {
      let bodyUsuario = '';
      req.on("data", (payload) => {
        bodyUsuario = JSON.parse(payload)
        })
      req.on("end", async () => {
        try {
          const data = await postUsuario(bodyUsuario);
          res.end(JSON.stringify(data));
        } catch (error) {
          res.end(error.code)
        }
      })
    }

    if (req.url.startsWith("/usuarios") && req.method == "GET") {
      try {
        const usuarios = await getUsuarios();
        res.end(JSON.stringify(usuarios));
      } catch (error) {
        res.end("Error al llamar la función getUsuarios()... " + error);
      }
    }

    if (req.url.startsWith("/usuario?") && req.method == "PUT") {
      let body = "";
      let { id } = url.parse(req.url, true).query;
      req.on("data", (chunk) => {
        body += chunk;
      });
      req.on("end", async () => {
        const data = Object.values(JSON.parse(body));
        data[2] = parseInt(id)
        try {
          const respuesta = await putUsuario(data);
          res.end(JSON.stringify(respuesta));
        } catch (error) {
          res.end(error)
        }
      });
    }

    if (req.url.startsWith("/usuario?") && req.method == "DELETE") {
      const { id } = url.parse(req.url, true).query;
      const todo = url.parse(req.url, true).query;
      try {
        const respuesta = await deleteUsuario(id);
        res.end(JSON.stringify(respuesta));
      } catch (error) {
        console.log('Error al llamar la función deleteUsuario()... ', error)
      }
    }
  
    if (req.url.startsWith("/transferencia") && req.method == "POST") {
      let bodyUsuario = '';
      req.on("data", (payload) => {
        bodyUsuario = JSON.parse(payload)
      })
      req.on("end", async () => {
        try {
          const response = await postTransferencia(bodyUsuario);
          res.end(JSON.stringify(response));
        } catch (error) {
          res.end('Error al llamar la función postTransferencia()... ', error)
        }
      })
    }

    if (req.url.startsWith("/transferencias") && req.method === "GET") {
      try {
        const transferencias = await getTransferencias();
        res.end(JSON.stringify(transferencias));
      } catch (error) {
        res.end("Error al llamar la función getTransferencias()... " + error);
        res.end(error);
      }
    }
    
  })

  .listen(3000, () => console.log('Servidor activo en puerto 3000'));