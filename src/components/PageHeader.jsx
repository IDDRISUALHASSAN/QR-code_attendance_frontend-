function PageHeader({
  title,
  subtitle,
}) {
  return (
    <div style={{ marginBottom: "30px" }}>
      <h1>{title}</h1>

      <p>{subtitle}</p>
    </div>
  );
}

export default PageHeader;