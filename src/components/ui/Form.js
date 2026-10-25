import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useId } from 'react';
export function Field({ label, htmlFor, hint, error, required, children, className = '', }) {
    return (_jsxs("div", { className: `field ${className}`.trim(), children: [_jsxs("label", { className: "field__label", htmlFor: htmlFor, children: [label, required ? _jsx("span", { className: "field__required", "aria-hidden": "true", children: " *" }) : null] }), children, error ? (_jsx("p", { className: "field__error", role: "alert", children: error })) : hint ? (_jsx("p", { className: "field__hint", children: hint })) : null] }));
}
export function TextField({ label, hint, error, prefix, fieldClassName, required, className = '', ...props }) {
    const generatedId = useId();
    const id = props.name ? `${props.name}-${generatedId}` : generatedId;
    return (_jsx(Field, { label: label, htmlFor: id, hint: hint, error: error, required: required, className: fieldClassName, children: _jsxs("div", { className: `input-wrap${prefix ? ' input-wrap--prefix' : ''}${error ? ' input-wrap--error' : ''}`, children: [prefix ? _jsx("span", { className: "input-prefix", children: prefix }) : null, _jsx("input", { id: id, className: `input ${className}`.trim(), required: required, ...props })] }) }));
}
export function TextAreaField({ label, hint, error, required, className = '', rows = 4, ...props }) {
    const generatedId = useId();
    const id = props.name ? `${props.name}-${generatedId}` : generatedId;
    return (_jsx(Field, { label: label, htmlFor: id, hint: hint, error: error, required: required, children: _jsx("textarea", { id: id, rows: rows, className: `textarea ${className}`.trim(), required: required, ...props }) }));
}
export function SelectField({ label, options, hint, error, placeholder, fieldClassName, required, className = '', ...props }) {
    const generatedId = useId();
    const id = props.name ? `${props.name}-${generatedId}` : generatedId;
    return (_jsx(Field, { label: label, htmlFor: id, hint: hint, error: error, required: required, className: fieldClassName, children: _jsx("div", { className: `select-wrap${error ? ' select-wrap--error' : ''}`, children: _jsxs("select", { id: id, className: `select ${className}`.trim(), required: required, ...props, children: [placeholder ? _jsx("option", { value: "", children: placeholder }) : null, options.map((option) => (_jsx("option", { value: option.value, children: option.label }, option.value)))] }) }) }));
}
export function SwitchField({ label, description, checked, onChange, disabled, }) {
    const id = useId();
    return (_jsxs("div", { className: `switch-field${disabled ? ' is-disabled' : ''}`, children: [_jsxs("div", { className: "switch-field__copy", children: [_jsx("label", { htmlFor: id, className: "switch-field__label", children: label }), description ? _jsx("p", { className: "switch-field__description", children: description }) : null] }), _jsxs("label", { className: "switch", children: [_jsx("input", { id: id, type: "checkbox", checked: checked, onChange: (event) => onChange(event.target.checked), disabled: disabled }), _jsx("span", { className: "switch__track", "aria-hidden": "true", children: _jsx("span", { className: "switch__thumb" }) })] })] }));
}
export function CheckboxField({ label, description, checked, onChange, error, disabled, }) {
    const id = useId();
    return (_jsxs("div", { className: `checkbox-field${error ? ' has-error' : ''}`, children: [_jsx("input", { id: id, type: "checkbox", checked: checked, onChange: (event) => onChange(event.target.checked), disabled: disabled }), _jsxs("div", { children: [_jsx("label", { htmlFor: id, children: label }), description ? _jsx("p", { className: "checkbox-field__description", children: description }) : null, error ? _jsx("p", { className: "field__error", role: "alert", children: error }) : null] })] }));
}
