import FieldText   from './fields/FieldText';
import FieldMemo   from './fields/FieldMemo';
import FieldSelect from './fields/FieldSelect';
import FieldCheck  from './fields/FieldCheck';
import FieldRadio  from './fields/FieldRadio';
import FieldDate   from './fields/FieldDate';
import FieldCID10  from './fields/FieldCID10';

const FIELD_MAP = {
  text:   FieldText,
  memo:   FieldMemo,
  select: FieldSelect,
  check:  FieldCheck,
  radio:  FieldRadio,
  date:   FieldDate,
  cid10:  FieldCID10,
};

/**
 * FormRenderer — renders any form_definition dynamically
 * Props:
 *   definition: { fields_json: FieldDefinition[] }
 *   data: { [field_id]: value }
 *   onChange: (fieldId, value) => void
 *   readOnly: boolean
 */
export default function FormRenderer({ definition, data = {}, onChange, readOnly = false }) {
  if (!definition?.fields_json?.length) {
    return (
      <p className="text-sm text-gray-400 italic">
        Este formulário não possui campos configurados.
      </p>
    );
  }

  const col1 = definition.fields_json.filter(f => f.grid_col !== 2);
  const col2 = definition.fields_json.filter(f => f.grid_col === 2);
  const hasCol2 = col2.length > 0;

  const renderField = (field) => {
    const Component = FIELD_MAP[field.type];
    if (!Component) {
      return (
        <div key={field.id} className="text-xs text-orange-500">
          Campo '{field.type}' não suportado: {field.label}
        </div>
      );
    }
    return (
      <Component
        key={field.id}
        field={field}
        value={data[field.id]}
        onChange={onChange}
        readOnly={readOnly}
      />
    );
  };

  if (!hasCol2) {
    return (
      <div className="flex flex-col gap-4">
        {definition.fields_json.map(renderField)}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="flex flex-col gap-4">{col1.map(renderField)}</div>
      <div className="flex flex-col gap-4">{col2.map(renderField)}</div>
    </div>
  );
}
