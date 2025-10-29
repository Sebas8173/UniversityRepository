from collections import deque
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

# 2. Implementacion de Busqueda en Amplitud (BFS) 
def busqueda_bfs(grafo, nodo_inicio, nodo_objetivo):
 
    visitados = set([nodo_inicio]) #nodos visitados
    cola = deque([nodo_inicio]) #cola para BFS
    padres = {nodo_inicio: None} #para reconstruir la ruta
    orden = [] # Para registrar el orden de recorrido

    while cola:    #mientras haya nodos en la cola hacer
        nodo_actual = cola.popleft() #sacar el primer nodo de la cola
        orden.append(nodo_actual) #guarda el nodo actual en orden de recorrido

        if nodo_actual == nodo_objetivo: #si el nodo actual es el objetivo
            ruta = [] #ruta del recorrido de regreso
            n = nodo_actual #comenzar desde el nodo objetivo
            while n is not None: #mientras haya nodos en la ruta
                ruta.append(n) #agregar el nodo a la ruta
                n = padres.get(n) #mover al padre del nodo
            ruta.reverse() #invertir la ruta para obtener el orden correcto
            return True, orden, ruta #encontrado

        for vecino in grafo.get(nodo_actual, []): # si no es el objetivo, explorar vecinos
            if vecino not in visitados: #si el vecino no ha sido visitado
                visitados.add(vecino) #marcar como visitado
                padres[vecino] = nodo_actual #establecer el padre
                cola.append(vecino) #agregar a la cola para explorar

    return False, orden, []  # No encontrado

# 3. Agente de Diagnostico (BFS)
def agente_diagnostico_bfs(sintomas_paciente, base_conocimiento): #inicio de la funcion
    objetivo = "Anemia" #definir el objetivo

    for sintoma_inicial in sintomas_paciente: #para cada sintoma del paciente
        if sintoma_inicial not in base_conocimiento: #si el sintoma no esta en la base de conocimiento
            continue #saltar al siguiente sintoma
        print(f"Iniciando busqueda BFS desde: '{sintoma_inicial}'...")  #mensaje de inicio
        encontrado, orden_recorrido, ruta = busqueda_bfs(base_conocimiento, sintoma_inicial, objetivo) #llamar a la funcion de busqueda BFS
        print("Orden de recorrido BFS:", " -> ".join(orden_recorrido)) #imprimir el orden de recorrido
        if encontrado: #si se encontro el objetivo
            print("--- Diagnostico Final (BFS) ---")
            print("Resultado: Paciente con anemia")
            print("Ruta de diagnostico (la mas corta):", " -> ".join(ruta)) #imprimir la ruta
            print("\n-------------------------------")
            return #finalizar la funcion

    # Si ningun sintoma llevo al objetivo
    print("--- Diagnostico Final (BFS) ---")
    print("Resultado: Paciente sin anemia")
    print("\n-------------------------------")
    
# 4. Ejecucion del Agente BFS   
if __name__ == "__main__":    
    # Caso 1: Paciente con palidez
    sintomas_1 = ['Palidez']
    agente_diagnostico_bfs(sintomas_1, base_conocimiento_anemia)
    
    # Caso 2: Paciente con sangrado nasal
    sintomas_2 = ['Sangrado nasal']
    agente_diagnostico_bfs(sintomas_2, base_conocimiento_anemia)