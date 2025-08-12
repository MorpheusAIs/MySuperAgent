import React, { FC, ComponentPropsWithoutRef } from "react";
import styles from "./Loader.module.css";

export interface LoaderProps extends ComponentPropsWithoutRef<"div"> {}

export const Loader: FC<LoaderProps> = () => {
  return (
    <div className={styles.loader}>
      <span className={styles.dot}></span>
      <span className={styles.dot}></span>
      <span className={styles.dot}></span>
    </div>
  );
};
