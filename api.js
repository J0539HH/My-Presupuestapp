// Api que gestiona peticiones a MONGODB by Jhosep Florez //

const express = require("express");
const moment = require("moment-timezone");
const router = express.Router();
const bodyParser = require("body-parser");
const jsonParser = bodyParser.json();
const { MongoClient } = require("mongodb");

// Conexion activa a la base de datos
const uri =
  "mongodb+srv://J0539H:vmX3NcLyn3rK0MDt@clusterdocutech.5iod7gv.mongodb.net/presupuesto?retryWrites=true&w=majority";
const client = new MongoClient(uri);
(async () => {
  try {
    await client.connect();
    console.log("Connected to MongoDB Atlas --> DOCUTECHCLUSTER (4000-JDFM)");
  } catch (err) {
    console.error(err);
  }
})();
const database = client.db("presupuesto");

router.get("/", (req, res) => {
  res.send("API funcionando by Jhosep Florez");
});

// Login de un usuario
router.post("/usuarios", jsonParser, async (req, res) => {
  let userL = req.body.usuario.trim();
  try {
    const collection = database.collection("usuarios");
    const query = {
      usuario: userL,
      password: req.body.password,
      estado: true,
    };
    const result = await collection.findOne(query);
    if (result) {
      res.json(result);
    } else {
      res.status(404).send("Usuario no encontrado");
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Registrar nuevo usuario
router.post("/NewUser", jsonParser, async (req, res) => {
  try {
    const { usuario, password, idrol, nombre, correo } = req.body;
    const collection = database.collection("usuarios");

    const lastUser = await collection.findOne({}, { sort: { idusuario: -1 } });
    const newId = lastUser ? lastUser.idusuario + 1 : 1;

    const result = await collection.insertOne({
      idusuario: newId,
      usuario,
      password,
      idrol,
      nombre,
      estado: true,
      correo,
    });
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Cargar todos los movimientos de este mes
router.post("/movimientosActuales", jsonParser, async (req, res) => {
  try {
    const { idusuario } = req.body;
    let idusuarioC = idusuario;
    const collection = database.collection("movimientos");

    // Obtener la fecha actual
    const fechaActual = new Date();

    // Obtener el mes actual (los meses comienzan desde 0)
    const mesActual = fechaActual.getMonth();

    // Configurar la fecha inicial y final para el mes actual
    const fechaInicioMes = new Date(fechaActual.getFullYear(), mesActual, 1);
    const fechaFinMes = new Date(fechaActual.getFullYear(), mesActual + 1, 0);

    // Convertir las fechas a formato ISO 8601
    const fechaInicioISO = fechaInicioMes.toISOString();
    const fechaFinISO = fechaFinMes.toISOString();

    // Filtrar los movimientos por la fecha del mes actual
    const result = await collection
      .find({
        fecha: {
          $gte: fechaInicioISO,
          $lte: fechaFinISO,
        },
        idusuario: parseInt(idusuarioC),
      })
      .toArray();

    if (result.length > 0) {
      res.json(result);
    } else {
      res.json("NULL");
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Registrar nuevo movimiento
router.post("/NewMovimiento", jsonParser, async (req, res) => {
  try {
    const { descripcion, valor, ingreso, idusuario } = req.body;
    const collection = database.collection("movimientos");
    const NewDate = moment().tz("America/Bogota").format();
    const lastMov = await collection.findOne(
      {},
      { sort: { idmovimiento: -1 } }
    );
    const newId = lastMov ? lastMov.idmovimiento + 1 : 1;
    const result = await collection.insertOne({
      idmovimiento: newId,
      descripcion: descripcion,
      valor: valor,
      fecha: NewDate,
      ingreso: ingreso,
      idusuario: parseInt(idusuario),
    });
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Eliminar movimiento especifico
router.post("/deleteMov", async (req, res) => {
  try {
    const idmovimiento = req.body.idmovimiento;
    const collection = database.collection("movimientos");
    const result = await collection.deleteOne({
      idmovimiento: idmovimiento,
    });
    if (result.deletedCount > 0) {
      res.json({ success: true });
    } else {
      res.status(404).send("Movimiento no encontrado");
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
