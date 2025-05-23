const usuarioActivo = localStorage.getItem('usuarioActivo');
const tipoUsuario = localStorage.getItem('tipoUsuario');
let usuarios = JSON.parse(localStorage.getItem('usuarios')) || {};

if (!usuarioActivo || tipoUsuario !== 'admin') {
    window.location.href = 'login.html';
  } else {
    document.getElementById('saludoAdmin').innerText = `Hola, ${usuarios[usuarioActivo].nombre}`;
    mostrarUsuariosFiltrados();
    mostrarEstadisticasDeProductos();
    mostrarPedidos(); //
  }
  

function mostrarUsuariosFiltrados() {
  const filtro = document.getElementById('filtroRol').value;
  const tbody = document.getElementById('tablaUsuarios');
  tbody.innerHTML = '';

  for (const usuario in usuarios) {
    const info = usuarios[usuario];
    const esAdmin = usuario === 'admin';
    const rol = esAdmin ? 'admin' : 'cliente';

    if (filtro !== 'todos' && filtro !== rol) continue;

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${usuario}</td>
      <td>${info.nombre}</td>
      <td>${info.fechaNacimiento}</td>
      <td>${info.correo}</td>
      <td>${rol.charAt(0).toUpperCase() + rol.slice(1)}</td>
      <td>
        ${usuario !== 'admin' ? `<button class="btn btn-sm btn-danger" onclick="eliminarUsuario('${usuario}')">Eliminar</button>` : 'No disponible'}
      </td>
    `;
    tbody.appendChild(tr);
  }
}

function mostrarEstadisticasDeProductos() {
    const productos = JSON.parse(localStorage.getItem('productos')) || [];
    const carrito = JSON.parse(localStorage.getItem('carrito')) || [];
    const conteo = {};
  
    carrito.forEach(id => {
      conteo[id] = (conteo[id] || 0) + 1;
    });
  
    const filtro = document.getElementById('filtroCategoria')?.value || 'todos';
    const tabla = document.getElementById('tablaProductos');
    const resumen = document.getElementById('productoMasAgregado');
    tabla.innerHTML = '';
  
    // Añadir campo 'veces' a cada producto
    const productosConConteo = productos.map(p => ({
      ...p,
      veces: conteo[p.id] || 0
    }));
  
    // Filtrado
    let productosFiltrados = productosConConteo;
  
    if (filtro === 'proteinas' || filtro === 'suplementos' || filtro === 'ansioliticos') {
      productosFiltrados = productosConConteo.filter(p => p.categoria === filtro);
    } else if (filtro === 'masAgregados') {
      productosFiltrados = [...productosConConteo].sort((a, b) => b.veces - a.veces);
    }
  
    // Mostrar en tabla
    let productoTop = null;
    let maxVeces = -1;
  
    productosFiltrados.forEach(prod => {
      const tr = document.createElement('tr');
tr.innerHTML = `
  <td>${prod.nombre}</td>
  <td>${prod.categoria}</td>
  <td>$${prod.precio.toFixed(2)}</td>
  <td>${prod.inventario ?? 'N/A'}</td> <!-- NUEVA COLUMNA -->
  <td>${prod.veces}</td>
`;

      tabla.appendChild(tr);
  
      if (prod.veces > maxVeces) {
        maxVeces = prod.veces;
        productoTop = prod.nombre;
      }
    });


  
    if (productoTop && maxVeces > 0) {
      resumen.innerText = ` Producto más agregado al carrito: "${productoTop}" (${maxVeces} veces)`;
    } else {
      resumen.innerText = `No hay productos agregados al carrito.`;
    }
  }
  


function eliminarUsuario(usuario) {
  if (!confirm(`¿Estás seguro de eliminar al usuario "${usuario}"?`)) return;

  delete usuarios[usuario];
  localStorage.setItem('usuarios', JSON.stringify(usuarios));
  mostrarUsuariosFiltrados();
}

function cerrarSesion() {
  localStorage.removeItem('usuarioActivo');
  localStorage.removeItem('tipoUsuario');
  window.location.href = '../source/energizen.html';
}

function cambiarAVistaCliente() {
  localStorage.setItem('modoVista', 'cliente'); // cambia la vista
  window.location.href = '../source/energizen.html'; // redirige al catálogo
}

function parseFecha(fechaStr) {
  // Asume formato DD/MM/YYYY o D/M/YYYY
  const [dia, mes, anio] = fechaStr.split('/').map(n => parseInt(n));
  return new Date(anio, mes - 1, dia); // los meses en JS van de 0 a 11
}


function mostrarPedidos() {
  const pedidos = JSON.parse(localStorage.getItem('tickets')) || [];
  const tabla = document.getElementById('tablaPedidos');
  tabla.innerHTML = '';

  const filtroMetodo = document.getElementById('filtroMetodoPago')?.value || 'todos';
  const filtroEstado = document.getElementById('filtroEstado')?.value || 'todos';
  const filtroOrden = document.getElementById('filtroOrden')?.value || 'recientes';
  const busqueda = document.getElementById('buscadorPedidos')?.value.trim().toLowerCase() || '';

  let pedidosFiltrados = pedidos;

  // Filtro por método de pago
  if (filtroMetodo !== 'todos') {
    pedidosFiltrados = pedidosFiltrados.filter(p => p.payment_method_id === filtroMetodo);
  }

  // Filtro por estado
  if (filtroEstado !== 'todos') {
    pedidosFiltrados = pedidosFiltrados.filter(p => p.status_id === filtroEstado);
  }

  // Filtro por búsqueda
  if (busqueda !== '') {
    pedidosFiltrados = pedidosFiltrados.filter(p =>
      p.ticket_id.toString().includes(busqueda) ||
      p.user_id.toLowerCase().includes(busqueda)
    );
  }

  // Ordenar por fecha
  pedidosFiltrados.sort((a, b) => {
const fechaA = parseFecha(a.created_data);
const fechaB = parseFecha(b.created_data);

    return filtroOrden === 'recientes' ? fechaB - fechaA : fechaA - fechaB;
  });

  // Mostrar en tabla
  pedidosFiltrados.forEach(p => {
    const productosHTML = p.product_list.map(prod => `${prod.cantidad}x ${prod.nombre} ($${prod.precio})`).join('<br>');

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${p.ticket_id}</td>
      <td>${p.user_id}</td>
      <td>${p.payment_method_id}</td>
      <td>${p.status_id}</td>
      <td>${productosHTML}</td>
      <td>$${p.total_price.toFixed(2)}</td>
      <td>${p.created_data}</td>
    `;
    tabla.appendChild(tr);
  });
}
