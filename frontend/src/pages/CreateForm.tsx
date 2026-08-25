import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface FieldInput {
  label: string;
  field_type: string;
  required: boolean;
  order_index: number;
}

export function CreateForm() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [slug, setSlug] = useState('');
  const [fields, setFields] = useState<FieldInput[]>([]);

  const addField = () => {
    setFields([
      ...fields,
      { label: '', field_type: 'text', required: false, order_index: fields.length + 1 }
    ]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      user_id: "90124376-7887-4b7b-99d8-91fb55dfc022",
      title,
      description,
      slug,
      fields
    };

    try {
      const res = await fetch('http://localhost:8080/api/forms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        alert('Formulário criado e gravado no PostgreSQL!');
        navigate('/admin');
      } else {
        const errorText = await res.text();
        alert('Erro ao criar formulário: ' + errorText);
      }
    } catch (err) {
      alert('Erro de conexão com o backend Go: ' + err);
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: '40px auto', padding: 20, fontFamily: 'sans-serif' }}>
      <h2>Criar Novo Formulário</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 15 }}>
          <label style={{ display: 'block', fontWeight: 'bold' }}>Título</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            style={{ width: '100%', padding: 8, marginTop: 5 }}
            required
          />
        </div>

        <div style={{ marginBottom: 15 }}>
          <label style={{ display: 'block', fontWeight: 'bold' }}>Descrição</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            style={{ width: '100%', padding: 8, marginTop: 5 }}
          />
        </div>

        <div style={{ marginBottom: 15 }}>
          <label style={{ display: 'block', fontWeight: 'bold' }}>Slug (URL Amigável)</label>
          <input
            type="text"
            placeholder="ex: pesquisa-satisfacao"
            value={slug}
            onChange={e => setSlug(e.target.value)}
            style={{ width: '100%', padding: 8, marginTop: 5, marginBottom: 5 }}
            required
          />
        </div>

        <h3>Perguntas do Formulário</h3>
        {fields.map((field, idx) => (
          <div key={idx} style={{ marginBottom: 10, marginTop: 5, padding: 10, border: '1px solid #ccc', borderRadius: 4  }}>
            <input
              type="text"
              placeholder="Pergunta / Label"
              value={field.label}
              onChange={e => {
                const updated = [...fields];
                updated[idx].label = e.target.value;
                setFields(updated);
              }}
              style={{ padding: 6, width: '60%', marginRight: 10 }}
              required
            />
            <select
              value={field.field_type}
              onChange={e => {
                const updated = [...fields];
                updated[idx].field_type = e.target.value;
                setFields(updated);
              }}
              style={{ padding: 6, marginRight: 10 }}
            >
              <option value="text">Texto</option>
              <option value="number">Número</option>
            </select>
            <label>
              <input
                type="checkbox"
                checked={field.required}
                onChange={e => {
                  const updated = [...fields];
                  updated[idx].required = e.target.checked;
                  setFields(updated);
                }}
              /> Obrigatorio
            </label>
          </div>
        ))}

        <button
          type="button"
          onClick={addField}
          style={{ padding: '8px 12px', background: '#6c757d', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', marginBottom: 20 }}
        >
          + Adicionar Campo
        </button>

        <br />

        <button
          type="submit"
          style={{ padding: '10px 20px', background: '#0d6efd', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}
        >
          Salvar Formulário
        </button>
      </form>
    </div>
  );
}