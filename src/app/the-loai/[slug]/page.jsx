"use client";
import React, { use } from "react";
import BrowseView from "@/components/shared/BrowseView";

export default function Page({ params }) {
    const { slug } = use(params);
    return <BrowseView type="the-loai" paramsSlug={slug} />;
}
