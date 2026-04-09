"use client";
import React, { use } from "react";
import BrowseView from "@/components/shared/BrowseView";

export default function Page({ params }) {
    const slug = null;
    return <BrowseView type="phim-bo" paramsSlug={slug} />;
}
