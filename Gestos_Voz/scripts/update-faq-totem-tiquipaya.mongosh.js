/**
 * FAQ UNIVALLE — TOTEM TIQUIPAYA (con palabra clave única por ítem)
 *
 * mongosh → use SistemaTotems → luego:
 * load("d:/Proyecto_Sistemas/31_06/PR1-26-TOTEM-A-main/PR1-26-TOTEM-A-main/Gestos_Voz/scripts/update-faq-totem-tiquipaya.mongosh.js")
 */

const FAQ_ID = ObjectId("6a162fa9aec0530125eca5d5");

const items = [
  {
    keyword: "gestos",
    question: "¿Cómo abro las preguntas frecuentes con gestos?",
    answer:
      "Levante la mano frente a la cámara unos segundos. Se mostrará el panel de consultas en pantalla.",
  },
  {
    keyword: "sede",
    question: "¿A qué sede pertenece este tótem?",
    answer: "Este tótem pertenece a la sede {{SEDE}}.",
  },
  {
    keyword: "estacionamiento",
    question: "¿Hay estacionamiento en el campus?",
    answer:
      "Sí. La universidad dispone de estacionamiento en sus espacios. Utilícelo respetando la señalización y las normas de circulación vigentes.",
  },
  {
    keyword: "atencion",
    question: "¿Cuál es el horario de atención?",
    answer:
      "De lunes a viernes de 8:00 a 18:00. Los sábados de 8:00 a 12:00.",
  },
  {
    keyword: "sabado",
    question: "¿Atienden los días sábado?",
    answer: "Sí. Contamos con atención los sábados de 8:00 a 12:00.",
  },
  {
    keyword: "feriado",
    question: "¿Cuándo es el próximo día feriado?",
    answer: "El siguiente día feriado es el jueves 4 de junio.",
  },
  {
    keyword: "biblioteca",
    question: "¿Cuál es el horario de la biblioteca?",
    answer:
      "La biblioteca atiende de lunes a viernes de 7:00 a 18:00, y los sábados de 7:00 a 14:00.",
  },
  {
    keyword: "cierre",
    question: "¿A qué hora cierra el campus?",
    answer: "El campus cierra sus puertas a partir de las 19:00.",
  },
  {
    keyword: "matricula",
    question: "¿Dónde pago mi matrícula?",
    answer:
      "Puede realizar el pago en cajas universitarias o mediante la plataforma virtual institucional.",
  },
  {
    keyword: "linea",
    question: "¿Puedo pagar la matrícula en línea?",
    answer:
      "Sí. UNIVALLE ofrece pagos en línea con tarjeta de débito, crédito y transferencias bancarias. El comprobante puede consultarse en servicios estudiantiles.",
  },
  {
    keyword: "qr",
    question: "¿Aceptan pago con QR o transferencia?",
    answer: "Sí. Aceptamos pagos con código QR y transferencia bancaria.",
  },
  {
    keyword: "comprobante",
    question: "¿Dónde veo mi comprobante de pago?",
    answer:
      "Acérquese a cajas o a plataformas universitarias, o descargue el comprobante desde el correo enviado al confirmar el pago.",
  },
  {
    keyword: "certificado",
    question: "¿Cuánto demora un certificado de estudio?",
    answer:
      "La entrega tiene una demora máxima de 3 días hábiles, según el tipo de certificado solicitado.",
  },
  {
    keyword: "constancia",
    question: "¿Dónde consulto mi constancia de notas?",
    answer:
      "Verifique y descargue su constancia en la plataforma SIU con su usuario institucional.",
  },
  {
    keyword: "cupos",
    question: "¿Qué hago si una materia está sin cupos?",
    answer:
      "Revise la disponibilidad en SIU o contacte a la coordinación académica de su carrera.",
  },
  {
    keyword: "wifi",
    question: "¿Cómo me conecto al WiFi de estudiantes?",
    answer:
      'Conéctese a la red "estudiantesUnivalle". La contraseña de acceso es Univalle1234.',
  },
  {
    keyword: "siu",
    question: "¿La plataforma SIU funciona en el celular?",
    answer:
      "Sí. Puede usar SIU desde el navegador o desde la aplicación móvil SIU, disponible para iPhone y Android.",
  },
  {
    keyword: "acceso",
    question: "¿Qué hago si no puedo entrar al sistema?",
    answer:
      "Verifique su conexión a internet y sus credenciales. Si el problema continúa, acuda a plataformas para recibir asistencia.",
  },
  {
    keyword: "prestamo",
    question: "¿Puedo pedir libros en préstamo en la biblioteca?",
    answer:
      "Sí. UNIVALLE brinda préstamo de libros físicos en biblioteca, según la normativa vigente.",
  },
  {
    keyword: "devolucion",
    question: "¿Qué pasa si devuelvo un libro tarde?",
    answer:
      "Los retrasos en la devolución pueden incluir restricciones en futuros préstamos o sanciones administrativas.",
  },
  {
    keyword: "computadoras",
    question: "¿Hay computadoras disponibles en biblioteca?",
    answer:
      "Sí. Contamos con una amplia cantidad de computadoras para consulta y trabajo académico.",
  },
  {
    keyword: "psicologia",
    question: "¿Hay atención psicológica para estudiantes?",
    answer:
      "Sí. Los estudiantes pueden acceder a orientación y atención psicológica de la universidad.",
  },
  {
    keyword: "medico",
    question: "¿Dónde está el servicio médico universitario?",
    answer:
      "La universidad cuenta con atención médica para apoyo básico de salud en campus.",
  },
  {
    keyword: "emergencia",
    question: "¿Qué hago ante una emergencia médica en campus?",
    answer:
      "Comuníquese de inmediato con el servicio médico universitario o con el personal de seguridad del campus.",
  },
  {
    keyword: "deportes",
    question: "¿Hay actividades deportivas en la universidad?",
    answer:
      "Sí. Hay programas deportivos, entrenamientos y eventos recreativos durante el año académico.",
  },
  {
    keyword: "acoso",
    question: "¿Cómo denuncio acoso o violencia?",
    answer:
      "Presente su denuncia por los canales institucionales habilitados para recibir orientación y apoyo.",
  },
  {
    keyword: "seguridad",
    question: "¿Dónde está el puesto de seguridad universitaria?",
    answer:
      "El servicio de seguridad está en la entrada de la universidad, listo para apoyarle ante emergencias.",
  },
  {
    keyword: "perdidos",
    question: "¿Qué hago si pierdo un objeto personal?",
    answer:
      "Informe al personal autorizado y consulte el servicio de objetos perdidos y encontrados.",
  },
  {
    keyword: "camaras",
    question: "¿Hay cámaras de seguridad en el campus?",
    answer:
      "Sí. La videovigilancia refuerza la seguridad conforme a las políticas institucionales vigentes.",
  },
  {
    keyword: "evacuacion",
    question: "¿Qué hago en una evacuación o sismo?",
    answer:
      "Siga los protocolos de emergencia: atienda instrucciones oficiales y diríjase a los puntos de encuentro señalizados.",
  },
  {
    keyword: "visitas",
    question: "¿Pueden ingresar visitas al campus?",
    answer:
      "Sí. El ingreso de visitas está permitido con carnet de identidad, según las normas de seguridad vigentes.",
  },
  {
    keyword: "motos",
    question: "¿Hay estacionamiento para motocicletas?",
    answer:
      "Sí. Hay estacionamiento para motocicletas. Respete las normas de circulación y seguridad del campus.",
  },
  {
    keyword: "cajeros",
    question: "¿Hay cajeros automáticos en la universidad?",
    answer:
      "Sí. Hay cajeros automáticos de Banco Sol y Banco Unión dentro de la institución.",
  },
  {
    keyword: "fotocopia",
    question: "¿Dónde puedo fotocopiar o imprimir documentos?",
    answer:
      "Hay puestos con fotocopiadoras e impresión disponibles dentro del campus.",
  },
  {
    keyword: "utiles",
    question: "¿Dónde compro útiles escolares en campus?",
    answer:
      "Hay puestos de venta de materiales y útiles escolares para sus actividades académicas.",
  },
  {
    keyword: "titulacion",
    question: "¿Qué modalidades de titulación existen?",
    answer:
      "Según su carrera: tesis, proyecto de grado, trabajo dirigido, examen de grado u otras modalidades autorizadas.",
  },
  {
    keyword: "abandono",
    question: "¿Qué es el abandono de carrera y cómo reingreso?",
    answer:
      "Es dejar de continuar estudios por el tiempo definido. Para reingresar, inicie el trámite de reincorporación.",
  },
  {
    keyword: "recuperacion",
    question: "¿Qué hago si repruebo una materia?",
    answer:
      "Puede rendir recuperación que reemplaza la nota más baja de un parcial. Si no alcanza el mínimo, vuelva a cursar en verano o invierno.",
  },
  {
    keyword: "doble",
    question: "¿Puedo estudiar dos carreras al mismo tiempo?",
    answer:
      "Sí, si cumple los requisitos académicos y administrativos establecidos por UNIVALLE.",
  },
  {
    keyword: "telefono",
    question: "¿Cuál es el teléfono central de UNIVALLE?",
    answer:
      "El teléfono central es +591 4 431 8800, para consultas académicas y administrativas.",
  },
  {
    keyword: "web",
    question: "¿Cuál es la página web oficial de UNIVALLE?",
    answer:
      "La página oficial es www.univalle.edu, con admisiones, carreras, servicios y trámites.",
  },
  {
    keyword: "whatsapp",
    question: "¿Tienen WhatsApp de atención?",
    answer:
      "Sí. Para admisiones e inscripción escriba al +591 79957127.",
  },
  {
    keyword: "redes",
    question: "¿Cuáles son las redes sociales oficiales?",
    answer:
      "Facebook: Univalle Bolivia. Instagram: @univalle.cochabamba.",
  },
  {
    keyword: "correo",
    question: "¿Cuál es el correo de información general?",
    answer:
      "El correo de información general es univalle@univalle.edu.",
  },
];

const result = db.faqs.updateOne(
  { _id: FAQ_ID },
  {
    $set: {
      title: "Preguntas frecuentes — UNIVALLE Tiquipaya",
      totemId: null,
      isActive: true,
      items,
      updatedAt: new Date(),
    },
  }
);

print("Modificados:", result.modifiedCount);
print("Items:", items.length);
print("Palabras clave:", items.map((i) => i.keyword).join(", "));
