\c template1
DROP DATABASE bancosolar;
CREATE DATABASE bancosolar;
\c bancosolar

CREATE TABLE usuarios (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(50) UNIQUE,
  balance FLOAT CHECK (balance >= 0),
  vigente BOOLEAN DEFAULT true
);

CREATE TABLE transferencias (
  id SERIAL PRIMARY KEY,
  emisor INT,
  receptor INT,
  monto FLOAT,
  fecha TIMESTAMP,
  FOREIGN KEY (emisor) REFERENCES usuarios(id),
  FOREIGN KEY (receptor) REFERENCES usuarios(id)
);

SELECT * FROM usuarios;
SELECT * FROM transferencias;

\q