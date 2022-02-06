/*
Consideraciones:
- Se adjunta archivo bancosolar.sql, el cual contiene las queries de creación de la BD y TABLAS.
- Para la tabla usuarios, el nombre se dejó como UNIQUE, para que no se permitan ingrear usuarios duplicados.
- Para la tabla usuarios, se agregó un campo adicional llamado VIGENTE de tipo BOOLEANO y con valor por defecto TRUE, con el fin de poder administras el listado de transferencias, esto va de la mano con el DELETE el cual no elimina el registro, sino que lo modifica, cambiando el valor del campo VIGENTE a FALSE.
- El postUsario, valida que si el usuario no existe lo crea, si el usuario existe pero fue eliminado, vuelve a cambiar la condición del campo VIGENTE a TRUE en la tabla USUARIOS, si el usuario existe y se encuentra vigente, envía por consola mensaje "Usuario existe en la BD y se encuentra vigente".
- Para la tabla de transferencias se realizó a través de queries con tablas temporales y JOIN.
- Me falto desarrollar de mejor manera la administración de los errores.
*/

const { Pool } = require('pg');

const config = {
  user: 'joseorellanaaravena',
  host: 'localhost',
  database: 'bancosolar',
  password: '240512',
  port: 5432,
  max: 50,
  min: 0,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

const pool = new Pool(config);

const postUsuario = async (usuario) => {
  try {

    const SQLconsultar = {
      text: 'SELECT vigente FROM usuarios WHERE nombre = $1',
      values: [usuario.nombre],
      rowMode: 'array'
    }

    const dataConsulta = await pool.query(SQLconsultar)

    if (dataConsulta.rows[0] == 'true') {
      console.log('Usuario existe en la BD y se encuentra vigente')
      return dataConsulta.rows
    } else if (dataConsulta.rows[0] == 'false') {
      const SQLvigentear = {
        text: 'UPDATE usuarios SET balance=$1, vigente=$2 WHERE nombre=$3 RETURNING *;',
        values: [usuario.balance, 'true', usuario.nombre]
      }
      const data = await pool.query(SQLvigentear)
      return data.rows
    } else {
      const SQLinsertar = {
        text: 'INSERT INTO usuarios (nombre, balance) VALUES ($1, $2) RETURNING *;',
        values: [usuario.nombre, usuario.balance]
      }
      const data = await pool.query(SQLinsertar);
      return data.rows
    }

  } catch (error) {
    console.log('Error query postUsuario()....', error)
    return error
  }
};

const getUsuarios = async () => {
  try {
      const SQLquery = {
        text: 'SELECT id, nombre, balance FROM usuarios WHERE vigente = $1 ORDER BY id;',
        values: ['t']
      }
      const data = await pool.query(SQLquery)
      return data.rows
  } catch (error) {
    console.log('Error query getUsuarios()....', error)
    return error.code
  }
};

const putUsuario = async (usuario) => {
  try {
    const SQLquery = {
      text: 'UPDATE usuarios SET nombre=$1, balance=$2 WHERE id=$3 RETURNING *;',
      values: [usuario[0], parseInt(usuario[1]), usuario[2]]
    }
    const data = await pool.query(SQLquery);
    return data.rows
  } catch (error) {
    console.log('Error query putUsuario()....', error)
  }
};

const deleteUsuario = async (id) => {
  try {
    const SQLquery = {
      text: 'UPDATE usuarios SET vigente=$2 WHERE id=$1 RETURNING *;',
      values: [parseInt(id), 'f']
    }
    const result = await pool.query(SQLquery);
    return result.rows;
  } catch (error) {
    console.log('Error query deleteUsuario()...', error);
    return error;
  }
};

const buscarIdEmisor = async (dato) => {

  const idEmisorSQL = {
    text: 'SELECT id FROM usuarios WHERE nombre = $1',
    values: [dato]
  }

  const idEmisor = await pool.query(idEmisorSQL)
  return idEmisor.rows[0].id
}

const buscarIdReceptor = async (dato) => {

  const idReceptorSQL = {
    text: 'SELECT id FROM usuarios WHERE nombre = $1',
    values: [dato]
  }

  const idReceptor = await pool.query(idReceptorSQL)
  return idReceptor.rows[0].id
}

const postTransferencia = async (datosTranferencia) => {
  datosTranferencia.fecha = new Date
  datosTranferencia.idEmisor = await buscarIdEmisor(datosTranferencia.emisor)
  datosTranferencia.idReceptor = await buscarIdReceptor(datosTranferencia.receptor)

  const cargo = {
    text: 'UPDATE usuarios SET balance = balance - $1 WHERE id = $2;',
    values: [parseFloat(datosTranferencia.monto), datosTranferencia.idEmisor]
  }

  const abono = {
    text: 'UPDATE usuarios SET balance = balance + $1 WHERE id = $2;',
    values: [parseFloat(datosTranferencia.monto), datosTranferencia.idReceptor]
  }

  const transferencia = {
    text: 'INSERT INTO transferencias (emisor, receptor, monto, fecha) VALUES ($1, $2, $3, $4) RETURNING *;',
    values: [datosTranferencia.idEmisor, datosTranferencia.idReceptor, parseFloat(datosTranferencia.monto), datosTranferencia.fecha]
  }

  try {
    await pool.query("BEGIN");
    await pool.query(cargo);
    await pool.query(abono);
    await pool.query(transferencia);
    await pool.query("COMMIT");
    return true;
  } catch (error) {
    console.log('entrando al catch de la transaccion, el error es:... ', error.code)
    await pool.query("ROLLBACK");
    return error.code
  }
};

const getTransferencias = async () => {
  try {

    const SQLtablaTempEmisor = {
      text: `
      CREATE TEMP TABLE tmp_emisor AS
      SELECT t.id as id, t.fecha as fecha, u.nombre as emisor, t.monto as monto
      FROM usuarios as u
      JOIN transferencias as t
      ON t.emisor = u.id;`
    }

    const SQLtablaTempReceptor = {
      text: `
      CREATE TEMP TABLE tmp_receptor AS
      SELECT t.id as id, u.nombre as receptor
      FROM usuarios as u
      JOIN transferencias as t
      ON t.receptor = u.id;`
    }

    const SQLTablaTransferencias = {
      text: `
      SELECT te.id, te.emisor as emisor, tr.receptor as receptor, te.monto as monto, te.fecha as fecha
      FROM tmp_receptor as tr
      JOIN tmp_emisor as te
      ON te.id = tr.id;`,
      rowMode: 'array',
    }

    const SQLElmiminarTemporales = {
      text: `
      DROP TABLE tmp_receptor;
      DROP TABLE tmp_emisor;
      `
    }

    await pool.query(SQLtablaTempEmisor)
    await pool.query(SQLtablaTempReceptor)
    const tablaTransferencias = await pool.query(SQLTablaTransferencias)
    await pool.query(SQLElmiminarTemporales)
    
    return tablaTransferencias.rows

  } catch (error) {
    console.log('Error query getTransferencias()....', error)
  }
};

module.exports = { postUsuario, getUsuarios, putUsuario, deleteUsuario, postTransferencia, getTransferencias };