import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']  
})
export class AppComponent implements OnInit {
  loginForm: FormGroup;
  registroForm: FormGroup;
  errorLogin = '';
  errorRegistro = '';
  usuarios: any[] = [];
  mostrandoCarrusel = false;
  juegos: any[] = [];
  juegosFiltrados: any[] = [];
  juegoDetalle: any = null;
  busqueda = '';
  plataformaSeleccionada = '';
  plataformas: string[] = [];
  mostrandoFormNuevo = false;
  nuevoJuego = { titulo: '', consola: '', imagen: '', descripcion: '', precio: '', estado: 'CIB' };
  carruselIndex = 0;
  carruselTimer: any;
  private juegosFallback: any[] = [];
  constructor(private fb: FormBuilder, private http: HttpClient) {
    this.loginForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required]
    });
    this.registroForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      username: ['', Validators.required],
      password: ['', Validators.required]
    });
  }
  ngOnInit() {
    this.cargarJuegosXML();
  }
  cargarJuegosXML() {
    this.http.get('/assets/juegos.xml', { responseType: 'text' }).subscribe({
      next: (xml) => {
        const doc = new DOMParser().parseFromString(xml, 'text/xml');
        const items = doc.getElementsByTagName('game');
        if (items.length === 0) {
          this.juegos = [...this.juegosFallback];
        } else {
          this.juegos = [];
          for (let i = 0; i < items.length; i++) {
            const item = items[i];
            const platformEl = item.getElementsByTagName('platform')[0];
            const consola = platformEl?.getElementsByTagName('displayname')[0]?.textContent ?? 'Desconocida';
            const precioRaw = item.getElementsByTagName('currentvalue')[0]?.textContent ?? '';
            const precio = precioRaw ? `$${parseFloat(precioRaw).toFixed(2)}` : 'N/A';
            const completenessEl = item.getElementsByTagName('completeness')[0];
            const estado = completenessEl?.getElementsByTagName('displayname')[0]?.textContent
              ?? completenessEl?.textContent ?? 'Desconocido';
            this.juegos.push({
              titulo: item.getElementsByTagName('title')[0]?.textContent ?? 'Sin titulo',
              consola,
              imagen: item.getElementsByTagName('coverfrontdefault')[0]?.textContent ?? '',
              descripcion: item.getElementsByTagName('description')[0]?.textContent?.replace(/<[^>]*>/g, '') ?? '',
              precio,
              estado
            });
          }
        }
        this.construirListaPlataformas();
        this.aplicarFiltros();
      },
      error: () => {
        this.juegos = [...this.juegosFallback];
        this.construirListaPlataformas();
        this.aplicarFiltros();
      }
    });
  }
  construirListaPlataformas() {
    const set = new Set(this.juegos.map(j => j.consola).filter(Boolean));
    this.plataformas = Array.from(set).sort();
  }
  aplicarFiltros() {
    const texto = this.busqueda.toLowerCase().trim();
    this.juegosFiltrados = this.juegos.filter(j => {
      const coincideTexto = !texto || j.titulo.toLowerCase().includes(texto);
      const coincidePlataforma = !this.plataformaSeleccionada || j.consola === this.plataformaSeleccionada;
      return coincideTexto && coincidePlataforma;
    });
    this.carruselIndex = 0;
    this.iniciarCarrusel();
  }
  limpiarFiltros() {
    this.busqueda = '';
    this.plataformaSeleccionada = '';
    this.aplicarFiltros();
  }
  login() {
    if (this.loginForm.invalid) return;
    const { username, password } = this.loginForm.value;
    const user = this.usuarios.find(u => u.username === username && u.password === password);
    if (user) {
      this.errorLogin = '';
      this.mostrandoCarrusel = true;
    } else {
      this.errorLogin = 'Usuario o contrasena incorrectos';
    }
  }
  registrar() {
    if (this.registroForm.invalid) return;
    const { username } = this.registroForm.value;
    if (this.usuarios.find(u => u.username === username)) {
      this.errorRegistro = 'Ese usuario ya existe';
      return;
    }
    this.usuarios.push(this.registroForm.value);
    this.errorRegistro = '';
    alert('Cuenta creada. Ya puedes iniciar sesion.');
    this.registroForm.reset();
  }
  abrirDetalle(juego: any) {
    this.juegoDetalle = juego;
    document.body.classList.add('modal-open');
  }
  cerrarDetalle(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('overlay')) {
      this.juegoDetalle = null;
      document.body.classList.remove('modal-open');
    }
  }
  cerrarDetalleBtn() {
    this.juegoDetalle = null;
    document.body.classList.remove('modal-open');
  }
  abrirFormNuevo() {
    this.mostrandoFormNuevo = true;
    document.body.classList.add('modal-open');
  }
  cerrarFormNuevo() {
    this.mostrandoFormNuevo = false;
    this.nuevoJuego = { titulo: '', consola: '', imagen: '', descripcion: '', precio: '', estado: 'CIB' };
    document.body.classList.remove('modal-open');
  }
  guardarNuevoJuego() {
    if (!this.nuevoJuego.titulo.trim() || !this.nuevoJuego.consola.trim()) return;
    this.juegos.unshift({ ...this.nuevoJuego });
    if (!this.plataformas.includes(this.nuevoJuego.consola)) {
      this.plataformas = [...this.plataformas, this.nuevoJuego.consola].sort();
    }
    this.aplicarFiltros();
    this.cerrarFormNuevo();
  }
  eliminarJuego(juego: any, event: MouseEvent) {
    event.stopPropagation();
    this.juegos = this.juegos.filter(j => j !== juego);
    this.construirListaPlataformas();
    this.aplicarFiltros();
  }
  iniciarCarrusel() {
    clearInterval(this.carruselTimer);
    if (this.juegosFiltrados.length === 0) return;
    this.carruselTimer = setInterval(() => {
      this.carruselIndex = (this.carruselIndex + 1) % this.juegosFiltrados.length;
    }, 3000);
  }
  carruselAnterior() {
    this.carruselIndex = (this.carruselIndex - 1 + this.juegosFiltrados.length) % this.juegosFiltrados.length;
    this.iniciarCarrusel();
  }
  carruselSiguiente() {
    this.carruselIndex = (this.carruselIndex + 1) % this.juegosFiltrados.length;
    this.iniciarCarrusel();
  }
  irAJuego(i: number) {
    this.carruselIndex = i;
    this.iniciarCarrusel();
  }
}