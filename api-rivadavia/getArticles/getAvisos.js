"use server";

export async function getAvisos() {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_CMS_URL_API}/avisos?populate=*`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_CMS_KEY}`,
      },
    }
  );
  const result = await response.json();
  return result;
}


export async function getAviso(id) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_CMS_URL_API}/avisos?populate=*&filters[slug][$eq]=${id}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_CMS_KEY}`,
      },
    }
  );
  const result = await response.json();
  

  if (result.data.length === 0) {
    return null;
  }

  const avisoData = result.data[0];
  const aviso = {
    title: avisoData.Title,
    subtitle: avisoData.Subtitle,
    buttonText: avisoData.ButtonText,
    buttonLink: avisoData.buttonLink,
    text: avisoData.Text || [],
    imageUrl: avisoData.Image?.url || "",
    metaTitle: avisoData.MetaTitle,
    metaDescription: avisoData.MetaDescription,
    slug: avisoData.Slug,
  };
  return aviso;
}
