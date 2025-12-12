import { Component, signal, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Calculator } from './calculator';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  protected readonly title = signal('Registro de Usuario');
  
  // Propiedades del formulario
  nombre: string = '';
  apellido: string = '';
  email: string = '';
  password: string = '';
  confirmPassword: string = '';
  edad: number | null = null;
  aceptaTerminos: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';

  ngOnInit() {
    // Inicialización del componente
  }

  // Método para manejar el envío del formulario
  onSubmit(): void {
    this.errorMessage = '';
    this.successMessage = '';

    // Validaciones básicas
    if (!this.nombre || !this.apellido || !this.email || !this.password || !this.confirmPassword) {
      this.errorMessage = 'Por favor, completa todos los campos obligatorios.';
      return;
    }

    if (!this.isValidEmail(this.email)) {
      this.errorMessage = 'Por favor, ingresa un email válido.';
      return;
    }

    if (this.password.length < 6) {
      this.errorMessage = 'La contraseña debe tener al menos 6 caracteres.';
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.errorMessage = 'Las contraseñas no coinciden.';
      return;
    }

    if (this.edad && this.edad < 18) {
      this.errorMessage = 'Debes ser mayor de 18 años para registrarte.';
      return;
    }

    if (!this.aceptaTerminos) {
      this.errorMessage = 'Debes aceptar los términos y condiciones.';
      return;
    }

    // Simulación de registro exitoso
    this.successMessage = `¡Registro exitoso! Bienvenido ${this.nombre} ${this.apellido}`;
    console.log('Datos del usuario:', {
      nombre: this.nombre,
      apellido: this.apellido,
      email: this.email,
      edad: this.edad
    });
  }

  // Método para validar email
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Método para limpiar el formulario
  clearForm(): void {
    this.nombre = '';
    this.apellido = '';
    this.email = '';
    this.password = '';
    this.confirmPassword = '';
    this.edad = null;
    this.aceptaTerminos = false;
    this.errorMessage = '';
    this.successMessage = '';
  }
}
