import React from 'react';
import styles from '../styles';


const regex = /^[A-Za-z0-9]+$/;

const CustomInput = ({ autocompleteValue, label, placeholder, value, handleValueChange, id }) => {
  return (
    <>
      <label htmlFor={id} className={styles.label}>{label}</label>
      <input
        id={id}
        type="text"
        placeholder={placeholder}
        value={value}
        autoComplete={autocompleteValue}
        onChange={(e) => {
            if(e.target.value === '' || regex.test(e.target.value)){
                handleValueChange(e.target.value)
            }
        }}
        className={styles.input}
        
        />
    </>
  )
}

export default CustomInput
