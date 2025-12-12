import { TestBed, ComponentFixture } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { App } from './app';

describe('App - Formulario de Registro', () => {
  let component: App;
  let fixture: ComponentFixture<App>;
  let compiled: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App, FormsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(App);
    component = fixture.componentInstance;
    compiled = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
  });

  // verificar que el componente se crea correctamente
  it('debe crear el componente', () => {
    expect(component).toBeTruthy();
  });

  // verificar que el titulo del formulario se renderiza correctamente
  it('debe renderizar el titulo "Registro de Usuario"', () => {
    const titulo = compiled.querySelector('h1');
    expect(titulo).toBeTruthy();
    expect(titulo?.textContent).toContain('Registro de Usuario');
  });

  // verificar que todos los campos de entrada (inputs) existen en el formulario
  it('debe tener todos los campos de entrada requeridos', () => {
    const inputNombre = compiled.querySelector('#nombre') as HTMLInputElement;
    const inputApellido = compiled.querySelector('#apellido') as HTMLInputElement;
    const inputEmail = compiled.querySelector('#email') as HTMLInputElement;
    const inputEdad = compiled.querySelector('#edad') as HTMLInputElement;
    const inputPassword = compiled.querySelector('#password') as HTMLInputElement;
    const inputConfirmPassword = compiled.querySelector('#confirmPassword') as HTMLInputElement;

    expect(inputNombre).toBeTruthy();
    expect(inputApellido).toBeTruthy();
    expect(inputEmail).toBeTruthy();
    expect(inputEdad).toBeTruthy();
    expect(inputPassword).toBeTruthy();
    expect(inputConfirmPassword).toBeTruthy();
  });

  // verificar que el checkbox de terminos y condiciones existe
  it('debe tener un checkbox para aceptar terminos y condiciones', () => {
    const checkbox = compiled.querySelector('#aceptaTerminos') as HTMLInputElement;
    expect(checkbox).toBeTruthy();
    expect(checkbox.type).toBe('checkbox');
  });

  // verificar que los botones de envio y limpiar existen
  it('debe tener botones de "Registrarse" y "Limpiar"', () => {
    const botones = compiled.querySelectorAll('button');
    expect(botones.length).toBe(2);
    
    const botonSubmit = botones[0] as HTMLButtonElement;
    const botonLimpiar = botones[1] as HTMLButtonElement;
    
    expect(botonSubmit.type).toBe('submit');
    expect(botonSubmit.textContent?.trim()).toBe('Registrarse');
    expect(botonLimpiar.type).toBe('button');
    expect(botonLimpiar.textContent?.trim()).toBe('Limpiar');
  });

  // verificar que los placeholders estan correctos
  it('debe tener los placeholders correctos en los inputs', () => {
    const inputNombre = compiled.querySelector('#nombre') as HTMLInputElement;
    const inputEmail = compiled.querySelector('#email') as HTMLInputElement;
    const inputPassword = compiled.querySelector('#password') as HTMLInputElement;

    expect(inputNombre.placeholder).toBe('Tu nombre');
    expect(inputEmail.placeholder).toBe('correo@ejemplo.com');
    expect(inputPassword.placeholder).toBe('Mínimo 6 caracteres');
  });

  // verificar validacion de campos obligatorios
  it('debe mostrar error si los campos obligatorios estan vacios', () => {
    component.nombre = '';
    component.apellido = '';
    component.email = '';
    component.password = '';
    component.confirmPassword = '';
    
    component.onSubmit();
    
    expect(component.errorMessage).toBe('Por favor, completa todos los campos obligatorios.');
  });

  //verificar si la contrasena es muy corta
  it('debe mostrar error si la contrasena es menor a 6 caracteres', () => {
    component.nombre = 'Juan';
    component.apellido = 'Pérez';
    component.email = 'juan@ejemplo.com';
    component.edad = 15;
    component.password = '123';
    component.confirmPassword = '123';
    component.aceptaTerminos = false;
    component.onSubmit();
    
    expect(component.errorMessage).toBe('La contraseña debe tener al menos 6 caracteres.');
    component.onSubmit();
  });

  //verificar edad minima
  it('debe mostrar error si la edad es menor a 18 anos', () => {
    component.nombre = 'Juan';
    component.apellido = 'Pérez';
    component.email = 'juan@ejemplo.com';
    component.edad = 15;
    component.password = '123456';
    component.confirmPassword = '123456';
    component.aceptaTerminos = true;
    component.onSubmit();

    expect(component.errorMessage).toBe('Debes ser mayor de 18 años para registrarte.');
  });

  // verificar aceptacion de terminos y condiciones
  it('debe mostrar error si no se aceptan los terminos y condiciones', () => {
    component.nombre = 'Juan';
    component.apellido = 'Pérez';
    component.email = 'juan@ejemplo.com';
    component.edad = 20;
    component.password = '123456';
    component.confirmPassword = '123456';
    component.aceptaTerminos = false;
    component.onSubmit();

    expect(component.errorMessage).toBe('Debes aceptar los términos y condiciones.');
  }); 

  // verificar validacion de email
  it('debe mostrar error si el email no es valido', () => {
    component.nombre = 'Juan';
    component.apellido = 'Pérez';
    component.email = 'email-invalido';
    component.password = '123456';
    component.confirmPassword = '123456';
    
    component.onSubmit();
    
    expect(component.errorMessage).toBe('Por favor, ingresa un email válido.');
  });

  // verificar que las contrasenas deben coincidir
  it('debe mostrar error si las contrasenas no coinciden', () => {
    component.nombre = 'Juan';
    component.apellido = 'Pérez';
    component.email = 'juan@ejemplo.com';
    component.password = '123456';
    component.confirmPassword = '654321';
    component.aceptaTerminos = true;
    
    component.onSubmit();
    
    expect(component.errorMessage).toBe('Las contraseñas no coinciden.');
  });

  // verificar registro exitoso
  it('debe mostrar mensaje de exito cuando el registro es valido', () => {
    component.nombre = 'Juan';
    component.apellido = 'Pérez';
    component.email = 'juan@ejemplo.com';
    component.password = '123456';
    component.confirmPassword = '123456';
    component.aceptaTerminos = true;
    
    component.onSubmit();
    
    expect(component.successMessage).toContain('¡Registro exitoso!');
    expect(component.successMessage).toContain('Juan Pérez');
  });

  // verificar que el formulario se limpia correctamente
  it('debe limpiar el formulario correctamente', () => {
    component.nombre = 'Juan';
    component.apellido = 'Pérez';
    component.email = 'juan@ejemplo.com';
    component.password = '123456';
    component.confirmPassword = '123456';
    component.edad = 25;
    component.aceptaTerminos = true;
    component.errorMessage = 'Error de prueba';
    component.successMessage = 'Exito de prueba';
    component.clearForm();
    expect(component.nombre).toBe('');
    expect(component.apellido).toBe('');
    expect(component.email).toBe('');
    expect(component.password).toBe('');
    expect(component.confirmPassword).toBe('');
    expect(component.edad).toBeNull();
    expect(component.aceptaTerminos).toBeFalse();
    expect(component.errorMessage).toBe('');
    expect(component.successMessage).toBe('');
  });
});
