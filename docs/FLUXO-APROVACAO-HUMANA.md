# 🤝 Fluxo com Aprovação Humana

## 🎯 Regra de Ouro

**NUNCA criar notas sem aprovação explícita do usuário.**

---

## 📋 Fluxo Correto

### **1. Listar Tickets Novos**

**Usuário:**
```
Processar tickets novos
```

**Claude:**
- Chama `list_new_tickets`
- Mostra lista de tickets aguardando

---

### **2. Analisar Ticket**

**Claude:**
- Chama `analyze_ticket_n1` para o primeiro ticket
- Recebe contexto do ticket + prompt N1
- Gera análise completa usando o prompt
- **MOSTRA** resultado ao usuário:

```markdown
## 📋 ORIENTAÇÃO PARA O ANALISTA N1

### Contexto do Problema
...

### Checklist de Verificação
...

---

## 💬 RESPOSTA PARA O CLIENTE

Olá [Nome],

...
```

---

### **3. Pedir Aprovação**

**Claude:**
```
Posso criar esta nota no ticket 12345? (sim/não)
```

**AGUARDA resposta do usuário!**

---

### **4. Criar Nota (SE aprovado)**

**Usuário:**
```
sim
```

**Claude:**
- Chama `create_note_approved`
- Cria nota no Movidesk
- Confirma sucesso

---

### **5. Próximo Ticket**

**Claude:**
Repete o processo para o próximo ticket da lista.

---

## ⚠️ O QUE NÃO FAZER

❌ Criar nota sem mostrar antes
❌ Criar nota sem pedir aprovação
❌ Assumir que "sim" para um ticket vale para todos
❌ Processar múltiplos tickets sem aprovação individual

---

## ✅ Palavras que Indicam Aprovação

- "sim"
- "pode"
- "aprovo"
- "ok"
- "cria"
- "confirmo"

---

## ❌ Quando NÃO Criar

- "não"
- "espera"
- "deixa eu ver"
- "vou revisar"
- Qualquer coisa ambígua → Pedir clarificação

---

## 🔄 Exemplo Completo

```
Usuário: Processar tickets novos

Claude: [chama list_new_tickets]
        Encontrei 3 tickets aguardando análise:
        1. #12345 - App fechando sozinho
        2. #12346 - Erro de login
        3. #12347 - Sincronização lenta
        
        Vou analisar o primeiro...
        
        [chama analyze_ticket_n1 para #12345]
        [gera análise completa]
        
        ## 📋 ORIENTAÇÃO PARA O ANALISTA N1
        ...
        
        ## 💬 RESPOSTA PARA O CLIENTE
        ...
        
        Posso criar esta nota no ticket #12345? (sim/não)

Usuário: sim

Claude: [chama create_note_approved]
        ✅ Nota criada no ticket #12345!
        
        Próximo ticket: #12346 - Erro de login
        [analisa]
        ...
        
        Posso criar esta nota no ticket #12346? (sim/não)

Usuário: não, deixa eu revisar primeiro

Claude: Ok! Vou aguardar. Me avise quando quiser criar.
        
        Quer que eu analise o próximo (#12347) ou prefere revisar este antes?
```

---

**Cada ticket = 1 aprovação individual!**
