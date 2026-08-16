# DATAFOOD_2.0
This is the the datafood project but using MySQL and modified


Como abrirlo para MYSQL

1. Instalar MySQl INSTALLER

![img.png](img.png) ir al apartado de add y agregarle el MySQL Server 80.6

De ahi seguir estos pasos 
![img_1.png](img_1.png)

![img_2.png](img_2.png)

![img_3.png](img_3.png) (contraseña propia)

![img_4.png](img_4.png)

![img_5.png](img_5.png)
 y luego next next hasta que diga execute


2. Conectar el servidor local 
bajar hasta donde salga un + y ponerle un nombre, le puse local y deje como esta
![img_6.png](img_6.png)

Luego Test Conection

![img_7.png](img_7.png)

en el apartado de contraseña root poner la contraseña que se puso cuando se instalo
![img_8.png](img_8.png)


3. listo para ejecutar scripts
![img_9.png](img_9.png)

doble click en el servidor que se acaba de crear y debe de abrirse un editor de sql


4.Ejecutar scripts

![img_10.png](img_10.png)

Ejecutar los scripts modulo, por modulo
tabla por tabla
procedure por procedure 
trigger por trigeer en el orden que esta

![img_11.png](img_11.png)
siempre seleccionar para ejecutar 
desde la palabra DELIMETER $$


![img_12.png](img_12.png)

y cuando DELIMETER $$, este despues de un drop
ignorar el drop y empezar desde DELIMETER $$



Para ejecutar es con el rayo

![img_13.png](img_13.png)


Primero ejecutar todo el DataBaseDataFood, y luego 
el otro script que solo es ingresar un usuario.



5. Coneccion Back

![img_14.png](img_14.png)
abrir el back y click derecho al archivo pom.xml
y agregar maven


(ya esta todo configurado y con rutas 
de coneccion con la database solo es ejecutar)


6. Coneccion con el front
una vez ejecutado el back 

npm install, para actualizar node 
y luego npm run dev 

![img_15.png](img_15.png)


7. ![img_16.png](img_16.png) Listo

la password del usuruario es password123