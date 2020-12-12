import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from "@angular/router";
import { UsuarioService } from '../servicios/usuario.service';
import { AlertController } from '@ionic/angular';
import { DeviceMotion, DeviceMotionAccelerationData } from '@ionic-native/device-motion/ngx';
import { Flashlight } from '@ionic-native/flashlight/ngx';
import { Vibration } from '@ionic-native/vibration/ngx';
import { timer } from 'rxjs';
import { USUARIOS } from 'src/app/mock/usuarios-mock';
import { ComplementosService } from 'src/app/servicios/complementos.service';

@Component({
	selector: 'app-home',
	templateUrl: 'home.page.html',
	styleUrls: ['home.page.scss'],
})
export class HomePage implements OnDestroy {
	public usuario = null;
	activo: boolean;
	private sub: any;
	private subscription;
	public arrAuxUsuarios: Array<any> = USUARIOS;
	audioIzq = new Audio();
	audioDer = new Audio();
	audioVer = new Audio();
	audioAcostado = new Audio();
	private warning = new Audio();
	public accX;
	public accY;
	public accZ;
	public splash: boolean = false;

	constructor(private router: Router, public alertController: AlertController, private deviceMotion: DeviceMotion,
		private flashlight: Flashlight, private vibration: Vibration, private auth: UsuarioService,private comp: ComplementosService) {
		this.activo = false;
	}

	ngOnInit() {
		this.splash = true;
		this.sub = this.auth.usuario.subscribe(user => {
			if (user !== null) {
				this.splash = false;
				this.usuario = user;
				console.log(this.usuario);
				this.audioIzq.src = '../../../assets/sonidos/alarmaIzq.mp3';
				this.audioDer.src = '../../../assets/sonidos/alarmaDer.mp3';
				this.audioAcostado.src = '../../../assets/sonidos/alarmaHor.mp3';
				this.audioVer.src = '../../../assets/sonidos/alarmaVert.mp3';
			}
		});
	}

	cambioEstado() {
		if (this.activo) {
			this.vibration.vibrate(1000);
			this.Accelerometer();
		} else {
			this.presentAlertPrompt();
		}
	}


	Accelerometer() {
		let flag = true;
		let flagAcostado = true;
		let flagIzq = true;
		let flagDer = true;
		this.subscription = this.deviceMotion.watchAcceleration({ frequency: 200 }).subscribe((acceleration: DeviceMotionAccelerationData) => {
			this.accX = acceleration.x;
			this.accY = acceleration.y;
			//horizontal y vibracion
			if ((this.accX > 5 || this.accX < -5) && flagAcostado === true) {
				flagAcostado = false;
				this.vibration.vibrate(5000);
				// izquierda
				if (this.accX > 5 && flagIzq === true) {
					flagIzq = false
					this.audioIzq.load();
					this.audioIzq.play();
				}
				// derecha
				else if (this.accX < -5 && flagDer === true) {
					flagDer = false;
					this.audioDer.load();
					this.audioDer.play();
				}
				setTimeout(() => {
					flagAcostado = true;
					flagDer = true;
					flagIzq = true;
				}, 5000);
			}
			// vertical y linterna
			if ((this.accY > 5 || this.accY < -5) && flag == true) {
				flag = false;
				this.flashlight.switchOn();
				this.audioVer.load();
				this.audioVer.play();
				setTimeout(() => {
					this.flashlight.switchOff();
				},5000);
			}
		});
	}

	async presentAlertPrompt() {
		const alert = await this.alertController.create({
			header: 'Usuario',
			message: this.usuario.email,
			inputs: [{ name: 'clave', type: 'number', placeholder: 'Contraseña' }],
			buttons: [
				{ text: 'Cancel', role: 'cancel', cssClass: 'secondary', handler: () => this.activo = true },
				{
					text: 'Ok',
					handler: data => {
						let i = this.arrAuxUsuarios.findIndex(x => x.clave == data.clave);
						if (i !== -1 && this.arrAuxUsuarios[i].correo === this.usuario.email) {
							this.subscription.unsubscribe();
							this.activo = false;
						} else {
							this.warning.load();
							this.warning.play();
							this.vibration.vibrate([500, 500]);
							this.activo = true;
						}
					}
				}
			]
		});
		await alert.present();
	}

	public cerrarSesion() {
		this.auth.logout().then(() => {
			this.comp.playAudio('error');
			this.router.navigate(['/']);
		})
	}

	public ngOnDestroy(): void {
		if (this.sub !== null) {
			this.sub.unsubscribe();
		}
	}
}
