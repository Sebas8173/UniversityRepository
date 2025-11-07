# 1. Definicion del Grafo (Entorno)
# Base de conocimiento para la anemia.
base_conocimiento_anemia = {
    'Fatiga': ['Caida de cabello', 'Alto consumo (cafe/te)'],
    'Palidez': ['Labios palidos', 'Unas quebradizas'],
    'Caida de cabello': ['Bajo consumo (carne/pescado)'],
    'Unas quebradizas': ['Bajo consumo (carne/pescado)'],
    'Labios palidos': ['Anemia'],
    'Alto consumo (cafe/te)': ['Anemia'],
    'Bajo consumo (carne/pescado)': ['Anemia'],
    'Anemia': [],
    'Dolor de cabeza': ['Estres'],
    'Sangrado nasal': ['posible anemia'],
}

# 2. Implementación de Búsqueda en Profundidad (DFS) 
def busqueda_dfs(grafo, nodo_inicio, nodo_objetivo):
    
    visitados = set() #nodos visitados, inicialmente vacio
    pila = [nodo_inicio] # pila inicial para DFS
    padres = {nodo_inicio: None} # para reconstruir la ruta
    orden = [] #regresa el orden de recorrido

    while pila:
        nodo_actual = pila.pop() #LIFO primero en entrar, ultimo en salir

        if nodo_actual not in visitados: #si no ha sido visitado
            visitados.add(nodo_actual) #marcar como visitado
            orden.append(nodo_actual) #guardar el nodo actual en orden de recorrido

            if nodo_actual == nodo_objetivo: #si el nodo actual es el objetivo
                ruta = [] #ruta del recorrido de regreso
                n = nodo_actual #comenzar desde el nodo objetivo
                while n is not None: #mientras haya nodos en la ruta
                    ruta.append(n) #agregar el nodo a la ruta
                    n = padres.get(n) #mover al padre del nodo
                ruta.reverse() #invertir la ruta para obtener el orden correcto
                return True, orden, ruta #encontrado

            vecinos = grafo.get(nodo_actual, []) # obtener vecinos del nodo actual
            
            for vecino in reversed(vecinos):  #para cada vecino del nodo actual (reversed para mantener orden)
                if vecino not in visitados: #si el vecino no ha sido visitado
                    padres[vecino] = nodo_actual #establecer el padre
                    pila.append(vecino) #agregar a la pila para explorar

    return False, orden, []  # No encontrado

# 3. Agente de Diagnóstico con DFS
def agente_diagnostico_dfs(sintomas_paciente, base_conocimiento): #inicio de la funcion
    objetivo = "Anemia" #definir el objetivo

    for sintoma_inicial in sintomas_paciente: #para cada sintoma del paciente
        if sintoma_inicial not in base_conocimiento: #si el sintoma no esta en la base de conocimiento
            continue #saltar al siguiente sintoma
        print(f"Iniciando búsqueda DFS desde: '{sintoma_inicial}'...") #mensaje de inicio
        encontrado, orden_recorrido, ruta = busqueda_dfs(base_conocimiento, sintoma_inicial, objetivo)
        print("Orden de recorrido DFS:", " -> ".join(orden_recorrido)) #imprimir el orden de recorrido
        if encontrado: #si se encontro el objetivo
            print("--- Diagnóstico Final (DFS) ---")
            print("Resultado: Paciente con anemia")
            print("Ruta de diagnóstico:", " -> ".join(ruta)) #imprimir la ruta
            print("\n-------------------------------")
            return #finalizar la funcion

    print("--- Diagnóstico Final (DFS) ---") 
    print("Resultado: Paciente sin anemia") 
    print("\n-------------------------------")


# --- 4. Ejecución del Agente DFS ---
if __name__ == "__main__":
   
    # Caso 1: Paciente con palidez
    sintomas_1 = ['Palidez']
    agente_diagnostico_dfs(sintomas_1, base_conocimiento_anemia)

    # Caso 2: Paciente con Sangrado nasal
    sintomas_2 = ['Unas quebradizas']
    agente_diagnostico_dfs(sintomas_2, base_conocimiento_anemia)